import { randomUUID } from "node:crypto";
import {
  AbstractAgent,
  EventType,
  type BaseEvent,
  type Interrupt,
  type Message,
  type RunAgentInput,
} from "@ag-ui/client";
import {
  AIMessage,
  AIMessageChunk,
  HumanMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { Observable } from "rxjs";

// Draft context
import { findDraftContext } from "./draft-context";

// Agents
import type { BaseAgent } from "@/agent";

// Constants
import {
  APPROVAL_INTERRUPT_REASON,
  APPROVAL_REJECT_MESSAGE,
  DRAFT_CONTEXT_CONFIG_KEY,
  GUARD_REPLIES,
  RELEASE_FORMAT_LABELS,
  type ReleaseFormat,
  THREAD_ACCESS_DENIED_MESSAGE,
  TOOL_NAMES,
  TRACE_METADATA_KEYS,
  TRACE_RUN_NAME,
  TRACE_TAG,
} from "@/constants";

// Schemas
import { ReleaseSchema } from "@/schemas";

// Utils
import {
  userContext,
  type AnswerEvaluationScheduler,
  type PromptInjectionGuard,
  type ThreadGate,
  type ThreadTitleScheduler,
} from "@/utils";

// Evaluators
import type { AnswerTurn } from "@/evaluators";

/** Flattens AG-UI user content (string or multimodal parts) to plain text. */
const toText = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => (part?.type === "text" ? String(part.text ?? "") : ""))
    .join("");
};

/**
 * AG-UI history -> LangChain messages. System/developer are owned by the server prompt. `input.context`
 * is not converted here: the draft entry is read in `run` and reaches the model through
 * `configurable` and the draft-context middleware, never as a stored message.
 */
export const toLangChainMessages = (input: RunAgentInput): BaseMessage[] =>
  input.messages.flatMap((message): BaseMessage[] => {
    switch (message.role) {
      case "user":
        // Keep the AG-UI id: the messages reducer dedupes by id, so a retry (or a resent history)
        // does not store the same user message twice. Empty id = no id, as before.
        return [new HumanMessage({ content: toText(message.content), id: message.id || undefined })];
      case "assistant":
        return [
          new AIMessage({
            content: message.content ?? "",
            tool_calls: message.toolCalls?.map((call) => ({
              id: call.id,
              name: call.function.name,
              args: JSON.parse(call.function.arguments || "{}"),
            })),
          }),
        ];
      case "tool":
        return [
          new ToolMessage({
            content: message.content,
            tool_call_id: message.toolCallId,
          }),
        ];
      default:
        return [];
    }
  });

/**
 * Checkpoint (LangChain) messages -> AG-UI messages, for replaying a thread after a restart.
 * System messages are skipped (the server prompt owns them). A message without an id gets the
 * stable id `<threadId>:<index>`, so the web keeps the same keys on every reconnect.
 */
export const toAguiMessages = (messages: BaseMessage[], threadId: string): Message[] =>
  messages.flatMap((message, index): Message[] => {
    const id = message.id || `${threadId}:${index}`;
    if (HumanMessage.isInstance(message)) return [{ id, role: "user", content: message.text }];
    if (AIMessage.isInstance(message)) {
      const toolCalls = (message.tool_calls ?? []).map((call) => ({
        id: call.id ?? `${id}:${call.name}`,
        type: "function" as const,
        function: { name: call.name, arguments: JSON.stringify(call.args) },
      }));
      return [
        {
          id,
          role: "assistant",
          content: message.text,
          ...(toolCalls.length ? { toolCalls } : {}),
        },
      ];
    }
    if (ToolMessage.isInstance(message)) {
      return [{ id, role: "tool", content: message.text, toolCallId: message.tool_call_id }];
    }
    return [];
  });

/**
 * With a checkpointer the thread already holds everything up to the last assistant reply. User
 * messages keep their AG-UI id (see `toLangChainMessages`), but assistant and tool messages do not,
 * so the reducer cannot dedupe a resent history (spike C). Keep only the user messages after the
 * last assistant message.
 */
/**
 * Removes turns the guard stopped (a guard reply and the user message before it) from a client
 * history, so a thread with no saved state does not store them when the next turn resends everything.
 */
export const dropGuardedTurns = (messages: BaseMessage[]): BaseMessage[] =>
  messages.filter((message, index) => {
    const isGuardReply = (m?: BaseMessage) =>
      !!m && AIMessage.isInstance(m) && GUARD_REPLIES.includes(m.text);
    return !isGuardReply(message) && !isGuardReply(messages[index + 1]);
  });

export const trimToNewMessages = (messages: BaseMessage[]): BaseMessage[] => {
  const lastAssistant = messages.findLastIndex((message) => AIMessage.isInstance(message));
  return messages.slice(lastAssistant + 1).filter((message) => HumanMessage.isInstance(message));
};

type ApprovalDecision = { type: "approve" } | { type: "reject"; message: string };

/**
 * AG-UI resume entries -> the decisions `humanInTheLoopMiddleware` expects.
 * Only an explicit `resolved` answer with `approve` approves; anything else rejects.
 */
export const toResumeCommand = (resume: NonNullable<RunAgentInput["resume"]>) =>
  new Command({
    resume: {
      decisions: resume.map(
        (entry): ApprovalDecision =>
          entry.status === "resolved" && entry.payload?.decision === "approve"
            ? { type: "approve" }
            : { type: "reject", message: APPROVAL_REJECT_MESSAGE },
      ),
    },
  });

/** LangGraph `__interrupt__` update -> AG-UI interrupts (one per pending approval). */
const toInterrupts = (raw: unknown): Interrupt[] =>
  (Array.isArray(raw) ? raw : []).flatMap((item: { id?: string; value?: ApprovalRequest }) =>
    (item.value?.actionRequests ?? []).map((action) => ({
      id: String(item.id),
      reason: APPROVAL_INTERRUPT_REASON,
      message: action.description,
      metadata: { toolName: action.name, args: action.args },
    })),
  );

/** Shape of a `humanInTheLoopMiddleware` interrupt value. */
type ApprovalRequest = {
  actionRequests: { name: string; args: Record<string, unknown>; description?: string }[];
};

/**
 * AG-UI agent that forwards server tool calls to the client (spike A, route B).
 *
 * Text and tool-call chunks stream as they arrive (TOOL_CALL_START/ARGS/END,
 * then TOOL_CALL_RESULT when the tool returns). The preview is not rendered
 * progressively: the web render tool shows the card only once the call has
 * its result (`status === "complete"`). `@ag-ui/langchain`'s `chainFn` cannot
 * emit a tool result event, hence this small custom agent.
 */
export class ReleaseNotesAguiAgent extends AbstractAgent {
  constructor(
    private readonly agent: BaseAgent,
    private readonly scheduleTitle?: ThreadTitleScheduler,
    private readonly guard?: PromptInjectionGuard,
    private readonly scheduleEvaluation?: AnswerEvaluationScheduler,
    private readonly threads?: ThreadGate,
  ) {
    super();
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable((subscriber) => {
      const emit = (event: Record<string, unknown>) =>
        subscriber.next(event as unknown as BaseEvent);

      const execute = async () => {
        console.log(`[agui] thread ${input.threadId}`);
        emit({
          type: EventType.RUN_STARTED,
          threadId: input.threadId,
          runId: input.runId,
        });

        // Owner check first: a thread of someone else is refused before any state is read.
        if (this.threads && !(await this.threads.canUse(input.threadId))) {
          throw new Error(THREAD_ACCESS_DENIED_MESSAGE);
        }

        // Runs before the graph so a blocked turn is never checkpointed (see createPromptInjectionGuard).
        const incoming = toLangChainMessages(input);
        const latest = incoming.at(-1);
        if (this.guard && !input.resume?.length && latest && HumanMessage.isInstance(latest)) {
          // Context for short follow-ups; guard replies are not real assistant turns.
          const previousAssistant = incoming
            .slice(0, -1)
            .findLast((m) => AIMessage.isInstance(m) && m.text !== "" && !GUARD_REPLIES.includes(m.text));
          const reply = await this.guard(latest.text, previousAssistant?.text);
          if (reply !== null) {
            const messageId = randomUUID();
            emit({ type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" });
            emit({ type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: reply });
            emit({ type: EventType.TEXT_MESSAGE_END, messageId });
            emit({ type: EventType.RUN_FINISHED, threadId: input.threadId, runId: input.runId });
            subscriber.complete();
            return;
          }
        }

        // The guard passed: create the owner row now (empty title). Losing a first-turn race means not ours.
        if (this.threads && !(await this.threads.claim(input.threadId))) {
          throw new Error(THREAD_ACCESS_DENIED_MESSAGE);
        }

        // The draft on screen for this turn only; see createDraftContextMiddleware.
        const draftContext = findDraftContext(input.context);

        // Our own id for the graph run, so the answer-quality scores can be attached to it in LangSmith.
        const langsmithRunId = randomUUID();
        const config = {
          runId: langsmithRunId,
          runName: TRACE_RUN_NAME,
          // Find a trace by conversation or owner; ignored by LangSmith when tracing is off.
          tags: [TRACE_TAG],
          metadata: {
            [TRACE_METADATA_KEYS.threadId]: input.threadId,
            [TRACE_METADATA_KEYS.userId]: userContext.getStore()?.userId,
          },
          configurable: {
            thread_id: input.threadId,
            // Object value on purpose: primitives would be copied into checkpoint metadata and traces.
            ...(draftContext ? { [DRAFT_CONTEXT_CONFIG_KEY]: draftContext } : {}),
          },
        };
        // With a checkpointer the thread already holds the history; resending it would duplicate messages.
        const snapshot = (await this.agent.getState(config)) as {
          values?: { messages?: unknown[] };
        };
        const hasState = (snapshot.values?.messages?.length ?? 0) > 0;
        const messages = hasState ? incoming : dropGuardedTurns(incoming);
        const agentInput = input.resume?.length
          ? toResumeCommand(input.resume)
          : { messages: hasState ? trimToNewMessages(messages) : messages };

        const stream = await this.agent.stream(agentInput, {
          ...config,
          streamMode: ["messages", "updates"],
        });
        const interrupts: Interrupt[] = [];

        // The model's chunk `index` ties arg deltas to their call id.
        const idByIndex = new Map<number, string>();
        const openCalls = new Set<string>();
        let textId: string | null = null;
        // A turn stopped by a guard streams no reply; it must leave no thread row, so no title.
        let producedReply = false;
        // What the answer-quality evaluators look at: streamed text and the rendered draft.
        let answer = "";
        let draft: AnswerTurn["draft"];

        const closeText = () => {
          if (!textId) return;
          emit({ type: EventType.TEXT_MESSAGE_END, messageId: textId });
          textId = null;
        };

        for await (const [mode, data] of stream) {
          if (mode === "updates") {
            // A LangGraph interrupt surfaces only as an `__interrupt__` update.
            interrupts.push(...toInterrupts((data as Record<string, unknown>).__interrupt__));
            continue;
          }
          const [chunk] = data;
          if (ToolMessage.isInstance(chunk)) {
            if (chunk.name === TOOL_NAMES.renderReleaseNotesPreview) {
              try {
                const result = JSON.parse(String(chunk.content));
                // Only a rendered result is a draft; refusals and over-limit errors leave it unset.
                const release = ReleaseSchema.safeParse(result.release);
                if (result.ok === true && release.success) {
                  draft = {
                    platform: result.format,
                    label: RELEASE_FORMAT_LABELS[result.format as ReleaseFormat],
                    content: result.text,
                    release: release.data,
                  };
                }
              } catch {
                // An unparsable result only means this turn gets no draft checks.
              }
            }
            closeText();
            if (openCalls.delete(chunk.tool_call_id)) {
              emit({
                type: EventType.TOOL_CALL_END,
                toolCallId: chunk.tool_call_id,
              });
            }
            emit({
              type: EventType.TOOL_CALL_RESULT,
              messageId: randomUUID(),
              toolCallId: chunk.tool_call_id,
              content: String(chunk.content),
              role: "tool",
            });
            continue;
          }
          if (!AIMessageChunk.isInstance(chunk)) continue;
          if (chunk.text !== "" || chunk.tool_call_chunks?.length) producedReply = true;

          for (const part of chunk.tool_call_chunks ?? []) {
            const index = part.index ?? 0;
            if (part.id && part.name) {
              closeText();
              idByIndex.set(index, part.id);
              openCalls.add(part.id);
              emit({
                type: EventType.TOOL_CALL_START,
                toolCallId: part.id,
                toolCallName: part.name,
              });
            }
            const id = idByIndex.get(index);
            if (id && part.args) {
              emit({
                type: EventType.TOOL_CALL_ARGS,
                toolCallId: id,
                delta: part.args,
              });
            }
          }

          // `.text` flattens both string content and content-block arrays.
          const { text } = chunk;
          if (text === "") continue;
          if (!textId) {
            textId = randomUUID();
            emit({
              type: EventType.TEXT_MESSAGE_START,
              messageId: textId,
              role: "assistant",
            });
          }
          answer += text;
          emit({
            type: EventType.TEXT_MESSAGE_CONTENT,
            messageId: textId,
            delta: text,
          });
        }

        closeText();
        // An interrupted tool call has no result yet; close it so the stream stays well formed.
        for (const id of openCalls) emit({ type: EventType.TOOL_CALL_END, toolCallId: id });
        emit({
          type: EventType.RUN_FINISHED,
          threadId: input.threadId,
          runId: input.runId,
          ...(interrupts.length ? { outcome: { type: "interrupt", interrupts } } : {}),
        });
        // A used turn (including one that ends in an approval) moves the thread up the list.
        if (producedReply) void this.threads?.touch(input.threadId);
        // Title generation is fire-and-forget, after RUN_FINISHED, and only for a completed turn.
        const firstUserMessage = messages.find((message) => HumanMessage.isInstance(message));
        if (producedReply && !interrupts.length && firstUserMessage) {
          this.scheduleTitle?.({ threadId: input.threadId, userMessage: firstUserMessage.text });
        }
        // Answer-quality checks are fire-and-forget too; guard-blocked and interrupted turns are skipped.
        if (producedReply && !interrupts.length) {
          this.scheduleEvaluation?.({
            runId: langsmithRunId,
            userInput: messages
              .filter((message) => HumanMessage.isInstance(message))
              .map((message) => message.text)
              .join("\n"),
            answer,
            draft,
          });
        }
        subscriber.complete();
      };

      execute().catch((error) => {
        emit({ type: EventType.RUN_ERROR, message: String(error) });
        subscriber.error(error);
      });
    });
  }

  clone(): ReleaseNotesAguiAgent {
    return new ReleaseNotesAguiAgent(
      this.agent,
      this.scheduleTitle,
      this.guard,
      this.scheduleEvaluation,
      this.threads,
    );
  }
}

/** Wraps a LangChain `createAgent` agent as an AG-UI agent (factory over singleton). */
export const createAguiAgent = (
  agent: BaseAgent,
  scheduleTitle?: ThreadTitleScheduler,
  guard?: PromptInjectionGuard,
  scheduleEvaluation?: AnswerEvaluationScheduler,
  threads?: ThreadGate,
) => new ReleaseNotesAguiAgent(agent, scheduleTitle, guard, scheduleEvaluation, threads);

export * from "./draft-context";
