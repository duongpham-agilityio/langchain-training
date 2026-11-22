import { InMemoryStore } from "@langchain/langgraph";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/config", () => ({ config: { databaseUrl: "postgres://test" } }));

import { createUserMemoryTools } from "./user-memory";

const run = (store: InMemoryStore, name: string, input: object, projectId?: string) => {
  const tool = createUserMemoryTools(store).find((t) => t.name === name)! as unknown as {
    invoke: (input: unknown, config: unknown) => Promise<string>;
  };
  return tool.invoke(input, { context: { userId: "u1", timeZone: "UTC", projectId } });
};

describe("user memory tools by scope", () => {
  it("saves global and project apart; project A never reaches project B or a new chat", async () => {
    const store = new InMemoryStore();
    await run(store, "saveUserPreferences", { tone: "formal", scope: "global" }, "A");
    await run(store, "saveUserPreferences", { tone: "playful", scope: "project" }, "A");
    expect(JSON.parse(await run(store, "getUserPreferences", {}, "A"))).toEqual({
      global: { tone: "formal" },
      project: { tone: "playful" },
    });
    expect(JSON.parse(await run(store, "getUserPreferences", {}, "B"))).toEqual({ global: { tone: "formal" } });
  });

  it("refuses project scope when the run has no project", async () => {
    const store = new InMemoryStore();
    expect(await run(store, "saveUserPreferences", { tone: "x", scope: "project" })).toMatch(/No project/);
    expect(await run(store, "getUserPreferences", {})).toBe("Nothing saved yet.");
  });

  it("clears only the project level", async () => {
    const store = new InMemoryStore();
    await run(store, "saveUserPreferences", { tone: "formal", scope: "global" }, "A");
    await run(store, "saveUserPreferences", { tone: "playful", scope: "project" }, "A");
    await run(store, "clearUserPreferences", { scope: "project" }, "A");
    expect(JSON.parse(await run(store, "getUserPreferences", {}, "A"))).toEqual({ global: { tone: "formal" } });
  });
});
