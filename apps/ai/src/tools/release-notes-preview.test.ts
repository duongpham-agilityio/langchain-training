import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRenderReleaseNotesPreview } from "./release-notes-preview";

const db = vi.hoisted(() => ({ getLatestReleaseVersion: vi.fn() }));
vi.mock("@/db", () => db);
vi.mock("@/config", () => ({ config: {} }));

const input = {
  format: "markdown",
  openingLine: "Hello.",
  changes: [{ id: "c1", type: "feature", breaking: false, description: "Add x" }],
};
const run = (context: unknown) =>
  createRenderReleaseNotesPreview({} as never).invoke(input as never, { context } as never);

beforeEach(() => vi.clearAllMocks());

describe("renderReleaseNotesPreview", () => {
  it("bumps from the latest version of the run's project", async () => {
    db.getLatestReleaseVersion.mockResolvedValue("1.4.0");
    const result = JSON.parse(String(await run({ userId: "u", timeZone: "UTC", projectId: "p1" })));
    expect(db.getLatestReleaseVersion).toHaveBeenCalledWith({}, "u", "p1");
    expect(result.ok).toBe(true);
    expect(result.release.version).toBe("1.5.0");
  });

  it("refuses a run with no project and reads nothing", async () => {
    const result = JSON.parse(String(await run({ userId: "u", timeZone: "UTC" })));
    expect(result.ok).toBe(false);
    expect(db.getLatestReleaseVersion).not.toHaveBeenCalled();
  });
});
