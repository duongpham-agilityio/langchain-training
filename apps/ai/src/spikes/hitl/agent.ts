import { LangChainAgent } from "@ag-ui/langchain";
import {
  AIMessageChunk,
  isAIMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import { randomUUID } from "node:crypto";

// Spike (M-05 / ticket 8): scripted stand-in for the LLM so the transport and
// UI path can be tested without keys. Throwaway.

export const SPIKE_AGENT_ID = "hitlSpikeAgent";
export const CONFIRM_TOOL_NAME = "confirmAction";

export interface RecordedAction {
  at: string;
  threadId: string;
  toolCallId: string;
  action: string;
}

/** Stand-in for the real side effect (e.g. publish to Slack). */
export const recordedActions: RecordedAction[] = [];

const textStream = (text: string) =>
  IterableReadableStream.fromAsyncGenerator(
    (async function* () {
      // Split so the bridge sees a real multi-chunk text stream.
      const mid = Math.ceil(text.length / 2);
      yield new AIMessageChunk({ content: text.slice(0, mid) });
      yield new AIMessageChunk({ content: text.slice(mid) });
    })(),
  );

/**
 * Streams a tool call the way a provider does: first chunk carries id + name,
 * the following chunks carry the JSON args. `@ag-ui/langchain` turns this into
 * TOOL_CALL_START / ARGS / END.
 */
const toolCallStream = (id: string, name: string, args: object) =>
  IterableReadableStream.fromAsyncGenerator(
    (async function* () {
      const json = JSON.stringify(args);
      const mid = Math.ceil(json.length / 2);
      yield new AIMessageChunk({
        content: "",
        tool_call_chunks: [{ id, name, args: "", index: 0, type: "tool_call_chunk" }],
      });
      yield new AIMessageChunk({
        content: "",
        tool_call_chunks: [{ args: json.slice(0, mid), index: 0, type: "tool_call_chunk" }],
      });
      yield new AIMessageChunk({
        content: "",
        tool_call_chunks: [{ args: json.slice(mid), index: 0, type: "tool_call_chunk" }],
      });
    })(),
  );

// The client may send the result as a bare string or JSON-encoded string.
const normalizeDecision = (content: unknown) => {
  const raw = typeof content === "string" ? content : JSON.stringify(content);
  return raw.replace(/^"|"$/g, "").trim().toLowerCase();
};

const findToolCallArgs = (messages: BaseMessage[], toolCallId: string) => {
  for (const message of messages) {
    if (!isAIMessage(message)) continue;
    const call = message.tool_calls?.find((c) => c.id === toolCallId);
    if (call) return call.args as { action?: string };
  }
  return {};
};

export const createSpikeAgent = () =>
  new LangChainAgent({
    chainFn: ({ messages, tools, threadId }) => {
      const last = messages.at(-1);

      // Resume: the client answered the confirmation tool call.
      if (last && ToolMessage.isInstance(last)) {
        const decision = normalizeDecision(last.content);
        const { action = "unknown action" } = findToolCallArgs(
          messages,
          last.tool_call_id,
        );
        if (decision === "approved") {
          recordedActions.push({
            at: new Date().toISOString(),
            threadId,
            toolCallId: last.tool_call_id,
            action,
          });
          return textStream(`Done: ${action} was executed.`);
        }
        return textStream(`Cancelled: ${action} was not executed.`);
      }

      // First turn: ask the client for confirmation via its frontend tool.
      if (tools.some((t) => t.name === CONFIRM_TOOL_NAME)) {
        return toolCallStream(`call_${randomUUID()}`, CONFIRM_TOOL_NAME, {
          action: "Publish release notes to Slack",
        });
      }
      return textStream(
        `Frontend tool ${CONFIRM_TOOL_NAME} not registered; tools: ${tools.map((t) => t.name).join(", ")}`,
      );
    },
  });
