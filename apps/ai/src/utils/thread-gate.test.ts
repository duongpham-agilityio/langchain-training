import { beforeEach, describe, expect, it, vi } from "vitest";

import { createThreadGate } from "./thread-gate";

const db = vi.hoisted(() => ({
  getThreadOwner: vi.fn(),
  claimThread: vi.fn(),
  touchThread: vi.fn(),
}));
vi.mock("@/db", () => db);

const ME = "user-me";
const OTHER = "user-other";
const P1 = "project-1";
const P2 = "project-2";
const gate = createThreadGate({} as never);

beforeEach(() => vi.clearAllMocks());

describe("canUse", () => {
  it("allows a thread with no row yet", async () => {
    db.getThreadOwner.mockResolvedValue(null);
    expect(await gate.canUse(ME, P1, "t")).toBe(true);
  });

  it("allows my thread in the same project", async () => {
    db.getThreadOwner.mockResolvedValue({ ownerId: ME, projectId: P1 });
    expect(await gate.canUse(ME, P1, "t")).toBe(true);
  });

  it("refuses a thread of another user", async () => {
    db.getThreadOwner.mockResolvedValue({ ownerId: OTHER, projectId: P1 });
    expect(await gate.canUse(ME, P1, "t")).toBe(false);
  });

  it("refuses my thread when it belongs to another project", async () => {
    db.getThreadOwner.mockResolvedValue({ ownerId: ME, projectId: P2 });
    expect(await gate.canUse(ME, P1, "t")).toBe(false);
  });
});

describe("claim", () => {
  it("claims into the project and succeeds when the row is mine", async () => {
    db.claimThread.mockResolvedValue({ ownerId: ME, projectId: P1 });
    expect(await gate.claim(ME, P1, "t")).toBe(true);
    expect(db.claimThread).toHaveBeenCalledWith({}, ME, P1, "t");
  });

  it("fails when the row belongs to someone else", async () => {
    db.claimThread.mockResolvedValue({ ownerId: OTHER, projectId: P1 });
    expect(await gate.claim(ME, P1, "t")).toBe(false);
  });

  it("fails when the row is mine but in another project", async () => {
    db.claimThread.mockResolvedValue({ ownerId: ME, projectId: P2 });
    expect(await gate.claim(ME, P1, "t")).toBe(false);
  });
});
