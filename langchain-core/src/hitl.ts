import { createInterface } from "node:readline/promises";
import { createAgent, humanInTheLoopMiddleware, tool } from "langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver, Command } from "@langchain/langgraph";
import * as z from "zod";
import { initCheckpointer } from "./db/init";

const isInMemory = true;
const pbCheckpointer = isInMemory
  ? new MemorySaver()
  : await initCheckpointer("hilt");

const executeSQL = tool(
  async ({ query }: Record<"query", string>) => `Executed: ${query}`,
  {
    name: "execute_sql",
    description: "Execute a SQL query on the database",
    schema: z.object({
      query: z.string().describe("Thông tin truy vấn từ user"),
    }),
  },
);

const agent = createAgent({
  model: "gpt-5.5",
  tools: [executeSQL],
  middleware: [
    humanInTheLoopMiddleware({
      interruptOn: {
        execute_sql: {
          allowedDecisions: ["approve", "reject"],
          description: "🚨 SQL execution requires DBA approval",
        },
      },
    }),
  ],
  checkpointer: pbCheckpointer,
});

const config = { configurable: { thread_id: "thread_user_123" } };
const rl = createInterface({ input: process.stdin, output: process.stdout });

console.log('Nhập câu hỏi (gõ "exit" để thoát)\n');

while (true) {
  const input = (await rl.question("User: ")).trim();

  if (!input) continue;
  if (input.toLowerCase() === "exit") break;

  // 1. Chạy stream events lần đầu
  let stream = await agent.streamEvents(
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

  if (stream.interrupted) {
    const answer = (
      await rl.question(
        "\nBạn có muốn phê duyệt thực thi tool này không? (y/n): ",
      )
    ).trim();

    const decisionType = answer.toLowerCase() === "y" ? "approve" : "reject";

    // 3. Tiếp tục chạy stream với Command chứa quyết định của người dùng
    const resumeStream = await agent.streamEvents(
      new Command({
        resume: {
          decisions: [
            {
              type: decisionType,
              ...(decisionType === "reject"
                ? { message: "User rejected the action." }
                : {}),
            },
          ],
        },
      }),
      { ...config, version: "v3" },
    );

    process.stdout.write("\nAssistant (Resumed): ");

    for await (const message of resumeStream.messages) {
      for await (const delta of message.text) {
        process.stdout.write(delta);
      }
    }
  }

  console.log("\n\n ----------------- \n\n");
}

rl.close();
