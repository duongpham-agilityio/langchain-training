import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthEnv } from "@/middlewares";
import { createThreadsRoute } from "./threads";

const db = vi.hoisted(() => ({ findOwnedProject: vi.fn(), listThreads: vi.fn() }));
vi.mock("@/db", () => db);

const OWNER = "11111111-1111-4111-8111-111111111111";
const PROJECT = "22222222-2222-4222-8222-222222222222";

const app = new Hono<AuthEnv>();
app.use("*", async (c, next) => {
  c.set("userId", OWNER);
  await next();
});
app.route("/", createThreadsRoute({} as never));

beforeEach(() => {
  vi.clearAllMocks();
  db.listThreads.mockResolvedValue([]);
});

describe("GET /api/memory/threads", () => {
  it("lists every thread of the owner without a project filter", async () => {
    expect((await app.request("/api/memory/threads")).status).toBe(200);
    expect(db.findOwnedProject).not.toHaveBeenCalled();
    expect(db.listThreads).toHaveBeenCalledWith({}, OWNER);
  });

  it("filters by an owned project", async () => {
    db.findOwnedProject.mockResolvedValue({ id: PROJECT });
    expect((await app.request(`/api/memory/threads?projectId=${PROJECT}`)).status).toBe(200);
    expect(db.listThreads).toHaveBeenCalledWith({}, OWNER, PROJECT);
  });

  it("answers 404 for a project the caller does not own", async () => {
    db.findOwnedProject.mockResolvedValue(null);
    const res = await app.request(`/api/memory/threads?projectId=${PROJECT}`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Project not found" });
    expect(db.listThreads).not.toHaveBeenCalled();
  });

  it("answers 404 for a malformed project id without a query", async () => {
    expect((await app.request("/api/memory/threads?projectId=nope")).status).toBe(404);
    expect(db.findOwnedProject).not.toHaveBeenCalled();
  });
});
