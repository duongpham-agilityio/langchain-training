import { createAgent, createMiddleware, tool } from "langchain";
import { MemorySaver } from "@langchain/langgraph";

type Config = Parameters<typeof agent.invoke>[1];

const inputs = [
  "Xin chào. Tôi tên là Dương",
  "Tôi tên là gì?",
  "Bạn biết LangChain không?",
  "Cho tôi biết các tính năng nổi bật của nó",
];
const config: Config = {
  configurable: {
    thread_id: "short-term-memory",
  },
};
const checkpointer = new MemorySaver(); // Lưu ở memory

const agent = createAgent({
  model: process.env.AI_MODEL ?? "",
  systemPrompt: `Bạn là trợ lý, giúp giải đáp các thắc mắc của người dùng`,
  checkpointer,
});

for await (const input of inputs) {
  const result = await agent.invoke(
    {
      messages: [{ role: "user", content: input }],
    },
    config,
  );

  result.messages.slice(-2).forEach((message) => {
    // Access message text using message.text
    console.log(`${message.type}: ${message.text}`);
  });
  console.log("\n\n--------------------------------\n\n");
}
