// Create the first agent

import { createAgent } from "langchain";

const agent = createAgent({
  model: process.env.AI_MODEL ?? "",
  systemPrompt: `Bạn là một trợ lý chuyên về summary thông tin nhận được từ user`,
});

const stream = await agent.streamEvents(
  {
    messages: [
      {
        role: "user",
        content: "Bạn là ai",
      },
    ],
  },
  { version: "v3" },
);

for await (const message of stream.messages) {
  for await (const delta of message.text) {
    process.stdout.write(delta);
  }
}
