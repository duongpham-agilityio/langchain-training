import { HumanMessage, ToolMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createAgent, FakeToolCallingModel, humanInTheLoopMiddleware, tool } from "langchain";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { userContext } from "@/utils/user-context";

import { createScheduleValidationMiddleware } from "./schedule-validation";

/** Real agent graph with a scripted model: checks the middleware order (refusal before approval). */
const run = async (localDateTime: string) => {
  const executed: unknown[] = [];
  const schedule = tool(
    async (args) => {
      executed.push(args);
      return "scheduled";
    },
    {
      name: "scheduleReleaseSend",
      description: "schedule",
      schema: z.object({ localDateTime: z.string() }),
    },
  );
  const agent = createAgent({
    model: new FakeToolCallingModel({
      toolCalls: [[{ id: "1", name: "scheduleReleaseSend", args: { localDateTime } }], []],
    }),
    tools: [schedule],
    checkpointer: new MemorySaver(),
    middleware: [
      humanInTheLoopMiddleware({
        interruptOn: { scheduleReleaseSend: { allowedDecisions: ["approve", "reject"] } },
      }),
      createScheduleValidationMiddleware(),
    ],
  });
  const result = await userContext.run({ userId: "u1", timeZone: "UTC" }, () =>
    agent.invoke({ messages: [new HumanMessage("send later")] }, { configurable: { thread_id: "t1" } }),
  );
  return { result: result as { messages: unknown[]; __interrupt__?: unknown }, executed };
};

describe("schedule validation in the agent graph", () => {
  it("a past time never raises the approval and the tool never runs", async () => {
    const { result, executed } = await run("2020-01-01T09:00");
    expect(result.__interrupt__).toBeUndefined();
    expect(executed).toHaveLength(0);
    const refusal = result.messages.find((m) => ToolMessage.isInstance(m)) as ToolMessage;
    expect(refusal.status).toBe("error");
  });

  it("a future time still pauses for approval", async () => {
    const { result, executed } = await run("2099-01-01T09:00");
    expect(result.__interrupt__).toBeDefined();
    expect(executed).toHaveLength(0);
  });
});
