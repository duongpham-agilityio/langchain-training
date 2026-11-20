import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthEnv } from "@/middlewares";
import { createReleaseHistoryRoutes } from "./release-history";

// Keep the route's own logic under test; the db helpers are mocked (InvalidCursorError is a class the route imports).
const db = vi.hoisted(() => ({
  findOwnedProject: vi.fn(),
  getLatestReleaseVersion: vi.fn(),
  listReleaseHistory: vi.fn(),
  saveReleaseHistory: vi.fn(),
  getReleaseHistory: vi.fn(),
  listReleaseSendRows: vi.fn(),
  cancelScheduledSend: vi.fn(),
  InvalidCursorError: class InvalidCursorError extends Error {},
}));
vi.mock("@/db", () => db);

const OWNER = "11111111-1111-4111-8111-111111111111";
const P1 = "22222222-2222-4222-8222-222222222222";
const P2 = "33333333-3333-4333-8333-333333333333";
const RELEASE = {
  version: "1.0.0",
  date: "20261120",
  openingLine: "First.",
  changes: [{ id: "c1", type: "feature", breaking: false, description: "Add x" }],
};

const app = new Hono<AuthEnv>();
app.use("*", async (c, next) => {
  c.set("userId", OWNER);
  await next();
});
app.route("/", createReleaseHistoryRoutes({} as never));

const post = (body: unknown) =>
  app.request("/release-history", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  // Only P1 belongs to the caller.
  db.findOwnedProject.mockImplementation(async (_pool, _owner, id) => (id === P1 ? { id } : null));
});

describe("POST /release-history", () => {
  it("saves into an owned project", async () => {
    db.saveReleaseHistory.mockResolvedValue({ id: "r1" });
    const res = await post({ projectId: P1, release: RELEASE });
    expect(res.status).toBe(201);
    expect(db.saveReleaseHistory).toHaveBeenCalledWith({}, OWNER, P1, expect.objectContaining({ release: RELEASE }));
  });

  it("refuses a foreign project with 404 and saves nothing", async () => {
    const res = await post({ projectId: P2, release: RELEASE });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Project not found" });
    expect(db.saveReleaseHistory).not.toHaveBeenCalled();
  });

  it("answers 400 without a project", async () => {
    expect((await post({ release: RELEASE })).status).toBe(400);
    expect(db.saveReleaseHistory).not.toHaveBeenCalled();
  });
});

describe("GET /release-history/latest-version", () => {
  it("answers per project", async () => {
    db.getLatestReleaseVersion.mockResolvedValue("1.2.0");
    const res = await app.request(`/release-history/latest-version?projectId=${P1}`);
    expect(await res.json()).toEqual({ version: "1.2.0" });
    expect(db.getLatestReleaseVersion).toHaveBeenCalledWith({}, OWNER, P1);
  });

  it("answers 404 for a foreign project and 400 without one", async () => {
    expect((await app.request(`/release-history/latest-version?projectId=${P2}`)).status).toBe(404);
    expect((await app.request("/release-history/latest-version")).status).toBe(400);
    expect(db.getLatestReleaseVersion).not.toHaveBeenCalled();
  });
});

describe("GET /release-history", () => {
  it("filters History by an owned project", async () => {
    db.listReleaseHistory.mockResolvedValue({ releases: [], nextCursor: null });
    expect((await app.request(`/release-history?projectId=${P1}`)).status).toBe(200);
    expect(db.listReleaseHistory).toHaveBeenCalledWith({}, OWNER, expect.objectContaining({ projectId: P1 }));
  });

  it("lists every project without a filter", async () => {
    db.listReleaseHistory.mockResolvedValue({ releases: [], nextCursor: null });
    expect((await app.request("/release-history")).status).toBe(200);
    expect(db.findOwnedProject).not.toHaveBeenCalled();
  });

  it("refuses a foreign project filter with 404", async () => {
    expect((await app.request(`/release-history?projectId=${P2}`)).status).toBe(404);
    expect(db.listReleaseHistory).not.toHaveBeenCalled();
  });
});
