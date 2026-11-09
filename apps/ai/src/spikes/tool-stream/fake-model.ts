import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessageChunk, type BaseMessage } from "@langchain/core/messages";
import type { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { ChatGenerationChunk, type ChatResult } from "@langchain/core/outputs";

/**
 * SPIKE (M-04, throwaway). Deterministic stand-in for the LLM so the spike needs
 * no OpenAI key: it emits the same `tool_call_chunks` shape a real OpenAI
 * stream does (id+name on the first chunk, JSON args in small deltas).
 */
export const PREVIEW_TOOL = "renderReleaseNotesPreview";

const PREVIEW_ARGS = {
  version: "2.4.0",
  title: "Payment Gateway Update",
  platform: "github",
  label: "GitHub",
  content:
    "## What's new\n- Retry failed payments automatically\n- Faster checkout confirmation\n\n## Fixes\n- Totals no longer round down on multi-currency carts",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Splits the JSON into ~10 char deltas, like a token stream. */
const splitDeltas = (json: string, size = 10) =>
  Array.from({ length: Math.ceil(json.length / size) }, (_, i) =>
    json.slice(i * size, (i + 1) * size),
  );

export class FakeToolStreamModel extends BaseChatModel {
  constructor(private readonly deltaDelayMs = 120) {
    super({});
  }

  _llmType() {
    return "fake-tool-stream";
  }

  // Tools are bound by the caller; the fake always "decides" the same way.
  bindTools() {
    return this as never;
  }

  async _generate(messages: BaseMessage[]): Promise<ChatResult> {
    let text = "";
    for await (const chunk of this._streamResponseChunks(messages)) text += chunk.text;
    return { generations: [{ text, message: new AIMessageChunk(text) }] };
  }

  // Like real chat models, report every chunk to the run manager: that is what
  // feeds LangGraph's `messages` stream mode token by token.
  async *_streamResponseChunks(
    messages: BaseMessage[],
    _options?: unknown,
    runManager?: CallbackManagerForLLMRun,
  ) {
    const last = messages[messages.length - 1];
    const emit = async (chunk: ChatGenerationChunk) => {
      await runManager?.handleLLMNewToken(chunk.text, undefined, undefined, undefined, undefined, { chunk });
      return chunk;
    };

    if (last?.getType() === "tool") {
      yield await emit(
        new ChatGenerationChunk({ text: "Draft ready.", message: new AIMessageChunk({ content: "Draft ready." }) }),
      );
      return;
    }

    yield await emit(
      new ChatGenerationChunk({
        text: "Building your release notes. ",
        message: new AIMessageChunk({ content: "Building your release notes. " }),
      }),
    );

    const callId = `call_spike_${Math.random().toString(36).slice(2, 8)}`;
    const deltas = splitDeltas(JSON.stringify(PREVIEW_ARGS));
    for (const [i, delta] of deltas.entries()) {
      await sleep(this.deltaDelayMs);
      yield await emit(new ChatGenerationChunk({
        text: "",
        message: new AIMessageChunk({
          content: "",
          tool_call_chunks: [
            {
              type: "tool_call_chunk",
              index: 0,
              args: delta,
              ...(i === 0 ? { id: callId, name: PREVIEW_TOOL } : {}),
            },
          ],
        }),
      }));
    }
  }
}
