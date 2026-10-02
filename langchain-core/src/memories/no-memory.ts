import { createAgent } from "langchain";

const agent = createAgent({
  model: process.env.AI_MODEL ?? "",
  systemPrompt: `Bạn là trợ lý, giúp giải đáp các thắc mắc của người dùng`,
});

type Config = Parameters<typeof agent.invoke>[1];

const inputs = ["Xin chào. Tôi tên là Dương", "Tôi tên là gì?"];
const config: Config = {
  configurable: {
    thread_id: "no-memory",
  },
};

for await (const input of inputs) {
  const result = await agent.invoke(
    {
      messages: [{ role: "user", content: input }],
    },
    config,
  );

  result.messages.forEach((message) => {
    console.log(`${message.type}: ${message.contentBlocks.at(-1)?.text}`);
  });

  console.log("\n\n--------------------------------\n\n");
}
