import { MemorySaver } from "@langchain/langgraph";
import {
  AIMessage,
  createAgent,
  createMiddleware,
  SystemMessage,
} from "langchain";
import * as z from "zod";

const ContextSchema = z.object({
  clientContext: z.array(
    z.object({
      description: z.string(),
      value: z.string(),
    }),
  ),
});

const checkpointer = new MemorySaver();

const dynamicPromptMiddleware = createMiddleware({
  name: "DynamicPrompt",
  contextSchema: ContextSchema,
  wrapModelCall: (request, handler) => {
    const externalContext = request.runtime.context?.clientContext ?? [];

    if (externalContext.length === 0)
      handler({
        ...request,
      });

    const dynamicContent = externalContext
      .map(
        ({ description, value }) =>
          `- ${description}: <content>${value}</content>`,
      )
      .join("\n\n");

    const systemMsg = new SystemMessage(
      `Thông tin ngữ cảnh hiện tại:\n${dynamicContent}`,
    );

    return handler({
      ...request,
      messages: [systemMsg, ...request.messages],
    });
  },
});

const agent = createAgent({
  model: process.env.AI_MODEL ?? "",
  systemPrompt: `Bạn là một trợ lý chuyên về summary thông tin nhận được từ user`,
  middleware: [dynamicPromptMiddleware],
  contextSchema: ContextSchema,
  checkpointer,
});

const postAPI = async (
  input: string,
  copilotContext: Record<"description" | "value", string>[] = [],
) => {
  console.log("User: ", input, "\n\n");

  const stream = await agent.streamEvents(
    {
      messages: [{ role: "user", content: input }],
    },
    {
      version: "v3",
      context: {
        clientContext: copilotContext,
      },
      configurable: {
        thread_id: "session-1",
      },
    },
  );

  process.stdout.write("Assistant: ");

  // Lặp qua raw protocol events để kiểm soát và lọc chính xác nội dung stream từ AI
  for await (const message of stream.messages) {
    for await (const text of message.text) {
      process.stdout.write(text);
    }
  }

  console.log("\n\n -------------- \n\n");
};

const inputs = ["xin chào", "tôi là ai?", "Giải thích về JEV model"];

for (const input of inputs) {
  await postAPI(input, [
    {
      description: "Đây là thông tin hiện tại vủa user đang chat với bạn",
      value: JSON.stringify({
        name: "Dương Phạm",
        currentWork: "Front-end developer",
        experience: "+3 Years",
      }),
    },
  ]);
}
