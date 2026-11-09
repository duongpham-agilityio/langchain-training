import { randomUUID } from "node:crypto";
import {
  AbstractAgent,
  EventType,
  type BaseEvent,
  type Interrupt,
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

// Agents
import type { BaseAgent } from "@/agent";

// Constants
import { APPROVAL_INTERRUPT_REASON, APPROVAL_REJECT_MESSAGE } from "@/constants";

/** Flattens AG-UI user content (string or multimodal parts) to plain text. */
const toText = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => (part?.type === "text" ? String(part.text ?? "") : ""))
    .join("");
};

/** AG-UI history -> LangChain messages. System/developer/context are owned by the server prompt. */
export const toLangChainMessages = (input: RunAgentInput): BaseMessage[] =>
  input.messages.flatMap((message): BaseMessage[] => {
    switch (message.role) {
      case "user":
        return [new HumanMessage(toText(message.content))];
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
  constructor(private readonly agent: BaseAgent) {
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

        const config = { configurable: { thread_id: input.threadId } };
        // With a checkpointer the thread already holds the history; resending it would duplicate messages.
        const snapshot = (await this.agent.getState(config)) as {
          values?: { messages?: unknown[] };
        };
        const hasState = (snapshot.values?.messages?.length ?? 0) > 0;
        const messages = toLangChainMessages(input);
        const agentInput = input.resume?.length
          ? toResumeCommand(input.resume)
          : { messages: hasState ? messages.slice(-1) : messages };

        const stream = await this.agent.stream(agentInput, {
          ...config,
          streamMode: ["messages", "updates"],
        });
        const interrupts: Interrupt[] = [];

        // The model's chunk `index` ties arg deltas to their call id.
        const idByIndex = new Map<number, string>();
        const openCalls = new Set<string>();
        let textId: string | null = null;

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
        subscriber.complete();
      };

      execute().catch((error) => {
        emit({ type: EventType.RUN_ERROR, message: String(error) });
        subscriber.error(error);
      });
    });
  }

  clone(): ReleaseNotesAguiAgent {
    return new ReleaseNotesAguiAgent(this.agent);
  }
}

/** Wraps a LangChain `createAgent` agent as an AG-UI agent (factory over singleton). */
export const createAguiAgent = (agent: BaseAgent) =>
  new ReleaseNotesAguiAgent(agent);
