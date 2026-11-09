import { LangChainAgent } from "@ag-ui/langchain";
import { AIMessage, AIMessageChunk, type BaseMessage } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { ChatResult } from "@langchain/core/outputs";
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import { createAgent } from "langchain";

// Siblings
import { trimToNewMessages } from "./history";
import { generateTitleInBackground, type TitleStore } from "./titles";

/**
 * Deterministic chat model that replies from a script and records the
 * messages of each call. It extends `BaseChatModel` directly, not
 * `FakeListChatModel`: that class's `bindTools` returns a fresh
 * `FakeStreamingChatModel`, which loses recording and the scripted replies.
 * `bindTools` returns `this` so `createAgent` keeps using this very instance
 * (the spike agent has no tools).
 */
export class RecordingModel extends BaseChatModel {
  /** One entry per model call: "type:text" of every message it received. */
  calls: string[][] = [];
  private i = 0;

  constructor(private readonly responses: string[]) {
    super({});
  }

  bindTools() {
    return this;
  }

  _llmType() {
    return "recording-fake";
  }

  async _generate(messages: BaseMessage[]): Promise<ChatResult> {
    this.calls.push(messages.map((m) => `${m.type}:${m.text}`));
    const text = this.responses[this.i++ % this.responses.length];
    return { generations: [{ text, message: new AIMessage(text) }] };
  }
}

export const createCheckpointedAgent = (
  model: BaseChatModel,
  checkpointer: BaseCheckpointSaver,
) => createAgent({ model, tools: [], checkpointer });

export type SpikeAgent = ReturnType<typeof createCheckpointedAgent>;

export type BridgeMode = "naive" | "trimmed";

export type BridgeOptions = {
  /** Builds the agent per run: a "reload" is a fresh agent on the same saver. */
  getAgent: () => SpikeAgent;
  mode: BridgeMode;
  /** Records the threadId the bridge handed to chainFn. */
  onThreadId?: (threadId: string) => void;
  /** Title generation, started after the stream ends and never awaited. */
  title?: {
    model: BaseChatModel;
    store: TitleStore;
    resourceId: string;
    delayMs: number;
    onError?: (error: unknown) => void;
  };
};

// A generator cannot be an arrow function, so this one stays a `function*`.
const streamText = async function* (
  agent: SpikeAgent,
  messages: BaseMessage[],
  threadId: string,
  onDone: () => void,
) {
  const stream = await agent.stream(
    { messages },
    { streamMode: "messages", configurable: { thread_id: threadId } },
  );
  for await (const [chunk] of stream) {
    if (!AIMessageChunk.isInstance(chunk) || chunk.text === "") continue;
    yield new AIMessageChunk({ content: chunk.text });
  }
  onDone();
};

export const createSpikeBridge = (options: BridgeOptions) =>
  new LangChainAgent({
    chainFn: ({ messages, threadId }) => {
      options.onThreadId?.(threadId);
      const input = options.mode === "trimmed" ? trimToNewMessages(messages) : messages;
      const firstUser = messages.find((m) => m.type === "human")?.text ?? "";
      const isFirstTurn = !messages.some((m) => m.type === "ai");
      return IterableReadableStream.fromAsyncGenerator(
        streamText(options.getAgent(), input, threadId, () => {
          const { title } = options;
          if (!title || !isFirstTurn) return;
          // Deliberately not awaited: RUN_FINISHED must not wait for the title.
          void generateTitleInBackground({
            ...title,
            threadId,
            firstUserText: firstUser,
          });
        }),
      );
    },
  });
