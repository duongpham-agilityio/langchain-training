import { describe, expect, it, vi } from "vitest";

// config.ts reads required env at import time; the runner only needs the types and pure parts.
vi.mock("@/config", () => ({
  config: { scheduler: { maxAttempts: 3, stuckJobTimeoutMs: 1, pollIntervalMs: 1, enabled: true } },
}));
vi.mock("@/db", () => ({}));
vi.mock("@/utils", async () => ({
  ...(await vi.importActual<object>("@/utils/scheduler-decision")),
  postToSlackWebhook: vi.fn(),
}));

import { runNextScheduledSend, type SchedulerDeps } from "./run-scheduled-sends";

const job = { id: "j1", ownerId: "o", releaseId: "r", content: "hi", attempts: 1 };
const now = new Date("2026-11-14T10:00:00Z");

const makeDeps = (over: Partial<SchedulerDeps> = {}): SchedulerDeps => ({
  claim: vi.fn().mockResolvedValue(job),
  post: vi.fn().mockResolvedValue(undefined),
  markSent: vi.fn().mockResolvedValue(undefined),
  retry: vi.fn().mockResolvedValue(undefined),
  fail: vi.fn().mockResolvedValue(undefined),
  maxAttempts: 3,
  retryDelayMs: 30_000,
  now: () => now,
  ...over,
});

describe("runNextScheduledSend", () => {
  it("does nothing when no job is due", async () => {
    const deps = makeDeps({ claim: vi.fn().mockResolvedValue(null) });
    expect(await runNextScheduledSend(deps)).toBe(false);
    expect(deps.post).not.toHaveBeenCalled();
  });

  it("posts the snapshot and marks the job sent", async () => {
    const deps = makeDeps();
    expect(await runNextScheduledSend(deps)).toBe(true);
    expect(deps.post).toHaveBeenCalledWith("hi");
    expect(deps.markSent).toHaveBeenCalledWith(job);
    expect(deps.retry).not.toHaveBeenCalled();
    expect(deps.fail).not.toHaveBeenCalled();
  });

  it("retries a failed attempt under the limit", async () => {
    const deps = makeDeps({ post: vi.fn().mockRejectedValue(new Error("Slack rejected the message")) });
    await runNextScheduledSend(deps);
    expect(deps.retry).toHaveBeenCalledWith(job, new Date("2026-11-14T10:00:30Z"), "Slack rejected the message");
    expect(deps.fail).not.toHaveBeenCalled();
    expect(deps.markSent).not.toHaveBeenCalled();
  });

  it("fails the job and stores the error at the attempt limit", async () => {
    const last = { ...job, attempts: 3 };
    const deps = makeDeps({
      claim: vi.fn().mockResolvedValue(last),
      post: vi.fn().mockRejectedValue(new Error("bad webhook")),
    });
    await runNextScheduledSend(deps);
    expect(deps.fail).toHaveBeenCalledWith(last, "bad webhook");
    expect(deps.retry).not.toHaveBeenCalled();
  });
});
