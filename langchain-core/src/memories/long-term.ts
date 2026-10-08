import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";
import {
  createAgent,
  dynamicSystemPromptMiddleware,
  tool,
  ToolRuntime,
} from "langchain";
import * as z from "zod";

const PG_DB = process.env.DB ?? "";
const schema = "custom";

const pgCheckpointer = PostgresSaver.fromConnString(PG_DB, {
  schema,
});
const pgStore = PostgresStore.fromConnString(PG_DB, {
  schema,
});

await pgCheckpointer.setup();
await pgStore.setup();

const userId = "my-user";

const contextSchema = z.object({ userId: z.string() });

const saveInfoTool = tool(
  async (
    name: string,
    runtime: ToolRuntime<unknown, z.infer<typeof contextSchema>>,
  ) => {
    const userId = runtime.context.userId;
    if (!userId) throw new Error("userId is required");
    await (runtime.store as unknown as PostgresStore)?.put(["users"], userId, {
      name,
    });
    return "Successfully saved user info.";
  },
  {
    name: "save_info",
    description: "Update/Save user information",
    schema: z.string().describe("user name"),
  },
);

const agent = createAgent({
  model: process.env.AI_MODEL ?? "",
  systemPrompt: `Bạn là trợ lý, giúp giải đáp các thắc mắc của người dùng`,
  checkpointer: pgCheckpointer,
  store: pgStore,
  contextSchema: contextSchema,
  tools: [saveInfoTool],
  middleware: [
    dynamicSystemPromptMiddleware<z.infer<typeof contextSchema>>(
      async (_, runtime) => {
        const userInfo = await runtime.store?.get(
          ["users"],
          runtime.context.userId,
        );

        if (!userInfo) return "";

        return `Đây là thông tin cần thiết về user ${JSON.stringify(userInfo.value)}`;
      },
    ),
  ],
});

type Config = Parameters<typeof agent.invoke>[1];

const inputs = [
  "Tôi tên là gì?",
  "Tôi tên là Thắng. Hãy ghi nhớ nó",
  "tôi tên gì",
];
const config: Config = {
  configurable: {
    thread_id: "no-memory",
  },
  context: { userId },
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
