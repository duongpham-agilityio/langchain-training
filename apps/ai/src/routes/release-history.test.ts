// HTTP tests against a running `@training/ai` server (`pnpm dev:ai`).
// Env: TEST_AUTH_TOKEN (Supabase session of the test user, required),
// optional BASE_URL (default http://localhost:4000), and
// TEST_EMPTY_USER_AUTH_TOKEN (a user with no saved releases, for the `null` case).
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4000";
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;
const EMPTY_USER_AUTH_TOKEN = process.env.TEST_EMPTY_USER_AUTH_TOKEN;

if (!AUTH_TOKEN) {
  throw new Error("TEST_AUTH_TOKEN is required to run the release-history HTTP tests");
}

const NEXT_VERSION_PATH = "/release-history/next-version";
const LATEST_VERSION_PATH = "/release-history/latest-version";
const RELEASE_HISTORY_PATH = "/release-history";

type VersionChange = { type: string; breaking: boolean };

const request = (
  path: string,
  { method = "GET", token = AUTH_TOKEN, body }: { method?: string; token?: string; body?: unknown } = {},
): Promise<Response> =>
  fetch(`${BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const nextVersion = async (body: {
  previousVersion?: string | null;
  changes: VersionChange[];
  statedVersion?: string | null;
}): Promise<string> => {
  const res = await request(NEXT_VERSION_PATH, { method: "POST", body });
  assert.equal(res.status, 200, `next-version returned ${res.status}`);
  const json = (await res.json()) as { version: string };
  return json.version;
};

const latestVersion = async (token?: string): Promise<string | null> => {
  const res = await request(LATEST_VERSION_PATH, { token });
  assert.equal(res.status, 200, `latest-version returned ${res.status}`);
  const json = (await res.json()) as { version: string | null };
  return json.version;
};

describe("POST /release-history/next-version", () => {
  it("bumps the major for a breaking change", async () => {
    const version = await nextVersion({
      previousVersion: "1.4.2",
      changes: [
        { type: "feature", breaking: true },
        { type: "fix", breaking: false },
      ],
    });
    assert.equal(version, "2.0.0");
  });

  it("bumps the minor for a feature with no breaking change", async () => {
    const version = await nextVersion({
      previousVersion: "1.4.2",
      changes: [
        { type: "feature", breaking: false },
        { type: "fix", breaking: false },
      ],
    });
    assert.equal(version, "1.5.0");
  });

  it("bumps the patch for fixes only", async () => {
    const version = await nextVersion({
      previousVersion: "1.4.2",
      changes: [
        { type: "fix", breaking: false },
        { type: "performance", breaking: false },
      ],
    });
    assert.equal(version, "1.4.3");
  });

  it("lets a breaking change win over a feature", async () => {
    const version = await nextVersion({
      previousVersion: "1.4.2",
      changes: [
        { type: "feature", breaking: false },
        { type: "docs", breaking: true },
      ],
    });
    assert.equal(version, "2.0.0");
  });

  it("starts at 1.0.0 when there is no previous release", async () => {
    const version = await nextVersion({
      previousVersion: null,
      changes: [{ type: "feature", breaking: false }],
    });
    assert.equal(version, "1.0.0");
  });

  it("returns a user-stated version as is, overriding the computed bump", async () => {
    const version = await nextVersion({
      previousVersion: "1.4.2",
      changes: [{ type: "fix", breaking: false }],
      statedVersion: "3.0.0-rc.1",
    });
    assert.equal(version, "3.0.0-rc.1");
  });
});

describe("GET /release-history/latest-version", () => {
  it("returns the newest saved release for the user", async () => {
    const stamp = Date.now();
    const older = `0.${stamp}.1`;
    const newer = `0.${stamp}.2`;

    for (const version of [older, newer]) {
      const res = await request(RELEASE_HISTORY_PATH, {
        method: "POST",
        body: {
          version,
          title: "Version bump test",
          platform: "github",
          label: "GitHub",
          content: "test",
        },
      });
      assert.equal(res.status, 201, `save returned ${res.status}`);
    }

    assert.equal(await latestVersion(), newer);
  });

  it("returns null when the user has no saved release", {
    skip: EMPTY_USER_AUTH_TOKEN
      ? false
      : "TEST_EMPTY_USER_AUTH_TOKEN not set (needs a user with no saved releases)",
  }, async () => {
    assert.equal(await latestVersion(EMPTY_USER_AUTH_TOKEN), null);
  });
});
