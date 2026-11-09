import { LangChainAgent } from "@ag-ui/langchain";
import { AIMessageChunk, type BaseMessage } from "@langchain/core/messages";
import { IterableReadableStream } from "@langchain/core/utils/stream";

// Agents
import type { BaseAgent } from "@/agent";

/**
 * Yields only the model's text chunks. Server tool calls are dropped so the
 * AG-UI history never holds tool calls the client cannot answer.
 * (A generator cannot be an arrow function, so this one stays a `function*`.)
 */
const streamTextChunks = async function* (
  agent: BaseAgent,
  messages: BaseMessage[],
  threadId: string,
) {
  const stream = await agent.stream(
    { messages },
    { streamMode: "messages", configurable: { thread_id: threadId } },
  );
  for await (const [chunk] of stream) {
    if (!AIMessageChunk.isInstance(chunk)) continue;
    
    // `.text` flattens both string content and content-block arrays.
    const { text } = chunk;
    
    if (text === "") continue;
    
    yield new AIMessageChunk({ content: text });
  }
};

/**
 * Wraps a LangChain `createAgent` agent with the official AG-UI bridge.
 * `@ag-ui/langchain` streams one model response and treats tools as frontend
 * tools; the agent runs its own server-side tool loop.
 */
export const createAguiAgent = (agent: BaseAgent) =>
  new LangChainAgent({
    chainFn: ({ messages, threadId }) => {
      console.log(`[agui] thread ${threadId}`);
      return IterableReadableStream.fromAsyncGenerator(
        streamTextChunks(agent, messages, threadId),
      );
    },
  });
