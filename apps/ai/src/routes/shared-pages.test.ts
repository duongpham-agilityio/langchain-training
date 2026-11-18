import { describe, expect, it, vi } from "vitest";

import { SHARED_PAGE_ERROR_MESSAGE } from "@/constants";
import { createSharedPagesRoute } from "./shared-pages";

// The `@/db` barrel reaches `config.ts`, which requires env vars at import; the route only needs the fake pool.
vi.mock("@/config", () => ({ config: {} }));

const ID = "3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b";
const PAGE = "<!doctype html><html><body>v1.2.0</body></html>";

const setup = (query = vi.fn().mockResolvedValue({ rows: [{ html: PAGE }] })) => {
  const route = createSharedPagesRoute({ query } as never);
  return { query, request: (path: string) => route.request(path) };
};

describe("GET /shared/:file", () => {
  it("serves the stored html as text/html", async () => {
    const { query, request } = setup();
    const res = await request(`/shared/${ID}.html`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(await res.text()).toBe(PAGE);
    expect(query.mock.calls[0][1]).toEqual([ID]);
  });

  it("returns 404 for a valid id with no row", async () => {
    const { request } = setup(vi.fn().mockResolvedValue({ rows: [] }));
    expect((await request(`/shared/${ID}.html`)).status).toBe(404);
  });

  it.each([
    "/shared/..%2Fsecret.html",
    "/shared/not-a-uuid.html",
    `/shared/${ID}.txt`,
  ])("returns 404 for %s without touching the database", async (path) => {
    const { query, request } = setup();
    expect((await request(path)).status).toBe(404);
    expect(query).not.toHaveBeenCalled();
  });

  it("returns a fixed 500 when the database throws", async () => {
    const { request } = setup(vi.fn().mockRejectedValue(new Error("secret detail")));
    const res = await request(`/shared/${ID}.html`);
    const body = await res.text();
    expect(res.status).toBe(500);
    expect(body).toContain(SHARED_PAGE_ERROR_MESSAGE);
    expect(body).not.toContain("secret detail");
  });
});
