import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { describe, expect, it } from "vitest";

import { TOOL_NAMES } from "@/constants";
import { userContext } from "@/utils/user-context";

import { createScheduleValidationMiddleware } from "./schedule-validation";

const now = new Date("2026-11-16T02:00:00Z");
const middleware = createScheduleValidationMiddleware(() => now);
// `afterModel` is `{ canJumpTo, hook }`.
const run = (messages: unknown[]) =>
  userContext.run({ userId: "u1", timeZone: "Asia/Ho_Chi_Minh" }, () =>
    (middleware.afterModel as unknown as { hook: (s: unknown) => unknown }).hook({ messages }),
  );

const scheduleCall = (id: string, localDateTime: string) => ({
  id,
  name: TOOL_NAMES.scheduleReleaseSend,
  args: { localDateTime },
});

describe("schedule validation middleware", () => {
  it("lets a future time through to the approval", () => {
    const ai = new AIMessage({ content: "", tool_calls: [scheduleCall("a", "2026-11-16T19:00")] });
    expect(run([new HumanMessage("x"), ai])).toBeUndefined();
  });

  it("answers a past time with an error and jumps back to the model", () => {
    const ai = new AIMessage({ content: "", tool_calls: [scheduleCall("a", "2026-11-16T07:00")] });
    const out = run([new HumanMessage("x"), ai]) as {
      jumpTo: string;
      messages: { tool_call_id: string; status: string; content: string }[];
    };
    expect(out.jumpTo).toBe("model");
    expect(out.messages).toHaveLength(1);
    expect(out.messages[0]).toMatchObject({ tool_call_id: "a", status: "error" });
    expect(out.messages[0].content).toContain("past");
  });

  it("answers every call of a refused message so the history stays well formed", () => {
    const ai = new AIMessage({
      content: "",
      tool_calls: [
        scheduleCall("a", "2026-11-16T07:00"),
        { id: "b", name: TOOL_NAMES.getCurrentDateTime, args: {} },
      ],
    });
    const out = run([ai]) as { messages: { tool_call_id: string }[] };
    expect(out.messages.map((m) => m.tool_call_id)).toEqual(["a", "b"]);
  });

  it("ignores other tools and plain replies", () => {
    expect(run([new AIMessage("hi")])).toBeUndefined();
    const ai = new AIMessage({
      content: "",
      tool_calls: [{ id: "c", name: TOOL_NAMES.publishReleaseNotesToSlack, args: {} }],
    });
    expect(run([ai])).toBeUndefined();
  });
});
