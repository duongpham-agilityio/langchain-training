import { createAgent, createMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

type Config = Parameters<typeof agent.invoke>[1];

const PG_DB = process.env.DB ?? "";
const schema = "custom";

const pgCheckpointer = PostgresSaver.fromConnString(PG_DB, {
  schema,
});

await pgCheckpointer.setup();

const inputs = ["Tôi tên là gì?"];
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
    const MAX_MESSAGES_INPUT = 10;
    if (requestMessages.length > MAX_MESSAGES_INPUT) {
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
    return handler(request);
  },
});

const checkpointer = new MemorySaver();

const agent = createAgent({
  model: process.env.AI_MODEL ?? "",
  systemPrompt: `Bạn là trợ lý, giúp giải đáp các thắc mắc của người dùng`,
  checkpointer: pgCheckpointer,
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
