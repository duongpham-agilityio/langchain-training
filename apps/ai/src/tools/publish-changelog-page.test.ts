import { describe, expect, it, vi } from "vitest";

import { CHANGELOG_PAGE_MAX_LENGTH, CHANGELOG_PAGE_MESSAGES } from "@/constants";
import { buildSharedPageUrl } from "@/utils";
import { userContext } from "@/utils/user-context";
import { createPublishChangelogPage } from "./publish-changelog-page";

// The `@/db` barrel reaches `config.ts`, which requires env vars at import; the tool only needs the fake pool.
vi.mock("@/config", () => ({ config: {} }));

const ID = "3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b";
const BASE = "http://x:4000";
const PAGE = "<!doctype html><html><body>v1.2.0</body></html>";

const setup = (query = vi.fn().mockResolvedValue({ rows: [{ id: ID }] }), baseUrl = BASE) => {
  const tool = createPublishChangelogPage({ query } as never, baseUrl);
  const run = (input: { title: string; html: string }, userId?: string) => {
    const call = () => tool.invoke(input);
    return userId ? userContext.run({ userId, timeZone: "UTC" }, call) : call();
  };
  return { query, run };
};

describe("publishChangelogPage", () => {
  it("saves the page for the signed-in user and returns its link", async () => {
    const { query, run } = setup();
    const out = JSON.parse(await run({ title: " September ", html: PAGE }, "u1"));
    expect(out).toEqual({ ok: true, title: "September", url: buildSharedPageUrl(BASE, ID) });
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][1]).toEqual(["u1", "September", PAGE]);
  });

  it("refuses without a signed-in user and does not touch the database", async () => {
    const { query, run } = setup();
    const out = JSON.parse(await run({ title: "t", html: PAGE }));
    expect(out).toEqual({ ok: false, error: CHANGELOG_PAGE_MESSAGES.NOT_SIGNED_IN });
    expect(query).not.toHaveBeenCalled();
  });

  it("refuses a page over the length limit and does not touch the database", async () => {
    const { query, run } = setup();
    const html = PAGE + "a".repeat(CHANGELOG_PAGE_MAX_LENGTH);
    const out = JSON.parse(await run({ title: "t", html }, "u1"));
    expect(out).toEqual({ ok: false, error: CHANGELOG_PAGE_MESSAGES.TOO_LONG });
    expect(query).not.toHaveBeenCalled();
  });

  it("checks the length before the doctype", async () => {
    const { run } = setup();
    const html = "<div>" + "a".repeat(CHANGELOG_PAGE_MAX_LENGTH) + "</div>";
    const out = JSON.parse(await run({ title: "t", html }, "u1"));
    expect(out.error).toBe(CHANGELOG_PAGE_MESSAGES.TOO_LONG);
  });

  it("refuses HTML that is not a full page and does not touch the database", async () => {
    const { query, run } = setup();
    const out = JSON.parse(await run({ title: "t", html: "<div>x</div>" }, "u1"));
    expect(out).toEqual({ ok: false, error: CHANGELOG_PAGE_MESSAGES.NOT_HTML });
    expect(query).not.toHaveBeenCalled();
  });

  it("accepts leading whitespace and an upper-case doctype", async () => {
    const { run } = setup();
    const out = JSON.parse(await run({ title: "t", html: "\n  <!DOCTYPE html><html></html>" }, "u1"));
    expect(out.ok).toBe(true);
  });

  it("hides the database error from the model", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { run } = setup(vi.fn().mockRejectedValue(new Error("secret detail")));
    const raw = await run({ title: "t", html: PAGE }, "u1");
    expect(JSON.parse(raw)).toEqual({ ok: false, error: CHANGELOG_PAGE_MESSAGES.SAVE_FAILED });
    expect(raw).not.toContain("secret detail");
  });

  it("builds the link without a double slash when the base URL ends with one", async () => {
    const { run } = setup(undefined, `${BASE}/`);
    const out = JSON.parse(await run({ title: "t", html: PAGE }, "u1"));
    expect(out.url).toBe(`${BASE}/shared/${ID}.html`);
    expect(out.url).not.toContain("//shared");
  });
});
