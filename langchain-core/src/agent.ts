// Create the first agent

import { createAgent } from "langchain";

const agent = createAgent({
  model: process.env.AI_MODEL ?? "",
  systemPrompt: `Bạn là một trợ lý chuyên về summary thông tin nhận được từ user`,
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "bạn là ai" }],
});

console.log(result.messages.at(-1)?.content);
