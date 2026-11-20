import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";

import type { AuthEnv } from "@/middlewares";
import { createProjectsRoute } from "./projects";

// The `@/db` barrel reaches `config.ts`, which requires env vars at import; the route only needs the fake pool.
vi.mock("@/config", () => ({ config: {} }));

const OWNER = "11111111-1111-4111-8111-111111111111";
const ROW = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Alpha",
  created_at: "2026-11-20T00:00:00Z",
  updated_at: "2026-11-20T00:00:00Z",
};

const setup = (rows: unknown[] = [ROW]) => {
  const query = vi.fn().mockResolvedValue({ rows });
  const app = new Hono<AuthEnv>();
  // Stands in for `createRequireAuth`: the verified owner.
  app.use("*", async (c, next) => {
    c.set("userId", OWNER);
    await next();
  });
  app.route("/", createProjectsRoute({ query } as never));
  const post = (body: unknown) =>
    app.request("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  return { query, post, get: () => app.request("/api/projects") };
};

describe("POST /api/projects", () => {
  it("creates a project for the caller (201) with the trimmed name", async () => {
    const { query, post } = setup();
    const res = await post({ name: "  Alpha  " });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      id: ROW.id,
      name: "Alpha",
      createdAt: "2026-11-20T00:00:00.000Z",
      updatedAt: "2026-11-20T00:00:00.000Z",
    });
    expect(query.mock.calls[0][1]).toEqual([OWNER, "Alpha"]);
  });

  it.each([{ name: "" }, { name: "   " }, { name: "x".repeat(81) }, {}, null])(
    "answers 400 for %j without touching the database",
    async (body) => {
      const { query, post } = setup();
      expect((await post(body)).status).toBe(400);
      expect(query).not.toHaveBeenCalled();
    },
  );
});

describe("GET /api/projects", () => {
  it("lists only the caller's projects", async () => {
    const { query, get } = setup();
    const res = await get();
    expect(res.status).toBe(200);
    expect(((await res.json()) as { projects: unknown[] }).projects).toHaveLength(1);
    expect(query.mock.calls[0][0]).toContain("owner_id = $1");
    expect(query.mock.calls[0][1]).toEqual([OWNER]);
  });
});
