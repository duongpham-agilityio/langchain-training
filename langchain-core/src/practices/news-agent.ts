import {
  createAgent,
  createMiddleware,
  HumanMessage,
  initChatModel,
  tool,
} from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import * as z from "zod";

type Config = Parameters<typeof agent.streamEvents>[1];

const checkpointer = new MemorySaver();

const summaryModel = await initChatModel(process.env.AI_MODEL ?? "");

const summary = tool(
  async (content) => {
    const result = await summaryModel.invoke([
      {
        role: "user",
        content: `Tóm tắt nội dung bên dưới thành 3-5 ý chính, dạng gạch đầu dòng, bằng tiếng Việt.\n\n<content>\n${content}\n</content>`,
      },
    ]);

    return result.text;
  },
  {
    name: "summary",
    description: "Tóm tắt nội dung",
    schema: z.string().describe("Content to summary"),
  },
);

const agent = createAgent({
  model: process.env.AI_MODEL ?? "",
  systemPrompt: `
    Bạn là trợ lý chuyên tìm kiếm và tóm tắt tin tức về trí tuệ nhân tạo (AI).
  `,
  checkpointer,
  tools: [summary],
});

const config: Config = {
  configurable: {
    thread_id: "news-agent-1",
  },
};

const inputs = [
  "Bạn biết gì về JEV model trong AI",
  "Làm sao để tôi setup nó",
  "Tôi có thể kết hợp nó với Claude Code không",
  "Làm sao để tôi đưa nó vào trong Agent mà tôi tự build với LangChainJS",
];

for await (const input of inputs) {
  console.log("User: ", input);

  const stream = await agent.streamEvents(
    {
      messages: [new HumanMessage(input)],
    },
    { ...config, version: "v3" },
  );

  process.stdout.write("\nAssistant: ");

  for await (const message of stream.messages) {
    for await (const delta of message.text) {
      process.stdout.write(delta);
    }
  }

  console.log("\n\n ----------------- \n\n");
}
