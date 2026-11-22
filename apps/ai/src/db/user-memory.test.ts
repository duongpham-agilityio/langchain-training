import { InMemoryStore } from "@langchain/langgraph";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/config", () => ({ config: { databaseUrl: "postgres://test" } }));

import { clearUserPreferences, getUserPreferences, saveUserPreferences } from "./user-memory";

describe("user memory levels", () => {
  it("keeps global and project records apart", async () => {
    const store = new InMemoryStore();
    await saveUserPreferences(store, "u1", { tone: "formal" });
    await saveUserPreferences(store, "u1", { tone: "playful" }, "A");
    expect(await getUserPreferences(store, "u1")).toEqual({ tone: "formal" });
    expect(await getUserPreferences(store, "u1", "A")).toEqual({ tone: "playful" });
  });

  it("never shares project memory between two projects or two users", async () => {
    const store = new InMemoryStore();
    await saveUserPreferences(store, "u1", { openingLine: "Hi A" }, "A");
    expect(await getUserPreferences(store, "u1", "B")).toEqual({});
    expect(await getUserPreferences(store, "u2", "A")).toEqual({});
  });

  it("clears one level without touching the other", async () => {
    const store = new InMemoryStore();
    await saveUserPreferences(store, "u1", { tone: "formal", writingStyle: "bullets" });
    await saveUserPreferences(store, "u1", { tone: "playful" }, "A");
    await clearUserPreferences(store, "u1", undefined, "A");
    expect(await getUserPreferences(store, "u1", "A")).toEqual({});
    await clearUserPreferences(store, "u1", ["tone"]);
    expect(await getUserPreferences(store, "u1")).toEqual({ writingStyle: "bullets" });
  });
});
