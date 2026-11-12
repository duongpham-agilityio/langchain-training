import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Hono } from "hono";

// Constants
import { RELEASE_EMAIL_RENDER_PATH } from "@/constants";

// The route barrel pulls in `config`, which throws without these. Dummy values: nothing here connects.
for (const name of [
  "OPENAI_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
]) {
  process.env[name] ??= "test";
}
const { createReleaseEmailRoute } = await import("@/routes");

const release = {
  version: "1.2.0",
  date: "20261112",
  openingLine: "A small release.",
  changes: [
    {
      id: "c1",
      type: "feature",
      breaking: false,
      description: "Add <script>alert(1)</script> support",
      refs: ["#12"],
    },
  ],
};

const post = (body: unknown) => {
  const app = new Hono();
  app.route("/", createReleaseEmailRoute());
  return app.request(RELEASE_EMAIL_RENDER_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

describe("POST /api/release-email/render", () => {
  it("renders subject and escaped inline-styled html", async () => {
    const res = await post(release);
    assert.equal(res.status, 200);
    const { subject, html } = (await res.json()) as { subject: string; html: string };
    assert.equal(subject, "Release 1.2.0 (20261112)");
    assert.ok(html.startsWith("<!doctype html>"));
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(!/<script/i.test(html));
    assert.ok(!/<style/i.test(html));
    assert.ok(!/<link/i.test(html));
  });

  it("returns 400 for an invalid body", async () => {
    const res = await post({ version: "" });
    assert.equal(res.status, 400);
  });
});
