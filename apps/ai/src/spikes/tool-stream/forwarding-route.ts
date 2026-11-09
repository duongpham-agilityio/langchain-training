import { randomUUID } from "node:crypto";
import { AbstractAgent, EventType, type BaseEvent, type RunAgentInput } from "@ag-ui/client";
import {
  AIMessage,
  AIMessageChunk,
  HumanMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { createAgent, tool } from "langchain";
import { Observable } from "rxjs";
import { z } from "zod";
import { FakeToolStreamModel, PREVIEW_TOOL } from "./fake-model";

/**
 * SPIKE route B: stream forwarding. The tool is a SERVER tool; a custom AG-UI
 * agent forwards its chunks as TOOL_CALL_START/ARGS/END and the ToolMessage
 * as TOOL_CALL_RESULT. `@ag-ui/langchain`'s `chainFn` cannot do this because it
 * can only return message chunks, never a tool *result* event.
 */
const serverPreviewTool = tool(async () => "rendered", {
  name: PREVIEW_TOOL,
  description: "Render the release notes preview card.",
  schema: z.object({
    version: z.string().nullish(),
    title: z.string().nullish(),
    platform: z.string(),
    label: z.string(),
    content: z.string(),
  }),
});

// Minimal AG-UI -> LangChain history conversion (user / assistant / tool).
const toLangChain = (input: RunAgentInput): BaseMessage[] =>
  input.messages.flatMap((m): BaseMessage[] => {
    if (m.role === "user") return [new HumanMessage(typeof m.content === "string" ? m.content : "")];
    if (m.role === "assistant")
      return [
        new AIMessage({
          content: m.content ?? "",
          tool_calls: m.toolCalls?.map((c) => ({
            id: c.id,
            name: c.function.name,
            args: JSON.parse(c.function.arguments),
          })),
        }),
      ];
    if (m.role === "tool") return [new ToolMessage({ content: m.content, tool_call_id: m.toolCallId })];
    return [];
  });

export class ForwardingAgent extends AbstractAgent {
  private readonly agent = createAgent({ model: new FakeToolStreamModel(), tools: [serverPreviewTool] });

  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable((subscriber) => {
      const emit = (event: BaseEvent) => subscriber.next(event);
      (async () => {
        emit({ type: EventType.RUN_STARTED, threadId: input.threadId, runId: input.runId } as BaseEvent);
        const stream = await this.agent.stream(
          { messages: toLangChain(input) },
          { streamMode: "messages" },
        );
        let textId: string | null = null;
        let openToolId: string | null = null;
        const closeTool = () => {
          if (openToolId) emit({ type: EventType.TOOL_CALL_END, toolCallId: openToolId } as BaseEvent);
          openToolId = null;
        };
        for await (const [chunk] of stream) {
          if (ToolMessage.isInstance(chunk)) {
            closeTool();
            emit({
              type: EventType.TOOL_CALL_RESULT,
              messageId: randomUUID(),
              toolCallId: chunk.tool_call_id,
              content: String(chunk.content),
              role: "tool",
            } as BaseEvent);
            textId = null; // next model turn is a new assistant message
            continue;
          }
          if (!AIMessageChunk.isInstance(chunk)) continue;
          const call = chunk.tool_call_chunks?.[0];
          if (call) {
            if (textId) {
              emit({ type: EventType.TEXT_MESSAGE_END, messageId: textId } as BaseEvent);
              textId = null;
            }
            if (call.id && call.name) {
              closeTool();
              openToolId = call.id;
              emit({
                type: EventType.TOOL_CALL_START,
                toolCallId: call.id,
                toolCallName: call.name,
              } as BaseEvent);
            }
            if (call.args && openToolId) {
              emit({ type: EventType.TOOL_CALL_ARGS, toolCallId: openToolId, delta: call.args } as BaseEvent);
            }
            continue;
          }
          if (chunk.text) {
            closeTool();
            if (!textId) {
              textId = randomUUID();
              emit({ type: EventType.TEXT_MESSAGE_START, messageId: textId, role: "assistant" } as BaseEvent);
            }
            emit({ type: EventType.TEXT_MESSAGE_CONTENT, messageId: textId, delta: chunk.text } as BaseEvent);
          }
        }
        closeTool();
        if (textId) emit({ type: EventType.TEXT_MESSAGE_END, messageId: textId } as BaseEvent);
        emit({ type: EventType.RUN_FINISHED, threadId: input.threadId, runId: input.runId } as BaseEvent);
        subscriber.complete();
      })().catch((error) => {
        emit({ type: EventType.RUN_ERROR, message: String(error) } as BaseEvent);
        subscriber.error(error);
      });
    });
  }

  clone(): ForwardingAgent {
    return new ForwardingAgent();
  }
}
