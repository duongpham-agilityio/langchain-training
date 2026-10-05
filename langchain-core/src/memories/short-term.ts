import { createAgent, createMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";

type Config = Parameters<typeof agent.invoke>[1];

const inputs = [
  "Xin chào. Tôi tên là Dương",
  "Tôi tên là gì?",
  "Bạn biết LangChain không?",
  "Cho tôi biết các tính năng nổi bật của nó",
  "Tôi tên là gì?", // Với cấu hình trim hiện tại, message này sẽ không trả lời được tên
];
const config: Config = {
  configurable: {
    thread_id: "short-term-memory",
  },
};

const trimMessages = createMiddleware({
  name: "Trim Messages",
  wrapModelCall: (request, handler) => {
    const requestMessages = [...request.messages];
    let newMessages = requestMessages;
    const MAX_MESSAGES_INPUT = 2;
    if (requestMessages.length > 2) {
      newMessages = requestMessages.slice((MAX_MESSAGES_INPUT + 1) * -1);
    }

    return handler({
      ...request,
      messages: newMessages,
    });
  },
});

const checkMessages = createMiddleware({
  name: "Check Messages",
  wrapModelCall: (request, handler) => {
    console.log(request.state.messages);

    return handler(request);
  },
});

const checkpointer = new MemorySaver(); // Lưu ở memory

const agent = createAgent({
  model: process.env.AI_MODEL ?? "",
  systemPrompt: `Bạn là trợ lý, giúp giải đáp các thắc mắc của người dùng`,
  checkpointer,
  middleware: [trimMessages, checkMessages],
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
