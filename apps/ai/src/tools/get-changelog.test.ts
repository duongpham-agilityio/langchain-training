import type { Pool } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PROJECT_REQUIRED_MESSAGE } from "@/constants";
import { listChangelog } from "@/db";

import { createGetChangelog } from "./get-changelog";

vi.mock("@/db", () => ({ listChangelog: vi.fn() }));

const USER_ID = "11111111-1111-1111-1111-111111111111";
const PROJECT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TIME_ZONE = "Asia/Ho_Chi_Minh";
const FAKE_POOL = {} as Pool;

/** Runs the tool the way ToolNode does: the run context is on the tool's runtime. */
const runGetChangelog = (context: Record<string, unknown>) =>
  createGetChangelog(FAKE_POOL).invoke({ month: "2026-11" }, { context } as never);

describe("get_changelog tool project scope", () => {
  beforeEach(() => {
    vi.mocked(listChangelog).mockReset();
    vi.mocked(listChangelog).mockResolvedValue({ releases: [], nextCursor: null });
  });

  it("reads only the run's project", async () => {
    await runGetChangelog({ userId: USER_ID, timeZone: TIME_ZONE, projectId: PROJECT_A });

    expect(listChangelog).toHaveBeenCalledTimes(1);
    expect(listChangelog).toHaveBeenCalledWith(
      FAKE_POOL,
      USER_ID,
      expect.objectContaining({ projectId: PROJECT_A }),
    );
  });

  it("answers with the project-required message and reads nothing when the run has no project", async () => {
    const output = await runGetChangelog({ userId: USER_ID, timeZone: TIME_ZONE });

    expect(JSON.parse(output as string)).toEqual({ ok: false, error: PROJECT_REQUIRED_MESSAGE });
    expect(listChangelog).not.toHaveBeenCalled();
  });
});
