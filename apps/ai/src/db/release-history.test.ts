import { describe, expect, it, vi } from "vitest";

import { getLatestReleaseVersion, listReleaseHistory, saveReleaseHistory } from "./release-history";
import { findReleaseId } from "./release-sends";

// The `@/db` barrel reaches `config.ts`, which requires env vars at import; these helpers only need the fake pool.
vi.mock("@/config", () => ({ config: {} }));

const pool = (rows: unknown[] = []) => {
  const query = vi.fn().mockResolvedValue({ rows });
  return { query, pool: { query } as never };
};

describe("per-project queries", () => {
  it("reads the latest version of one project only", async () => {
    const { query, pool: p } = pool([{ version: "2.0.0" }]);
    expect(await getLatestReleaseVersion(p, "owner", "proj")).toBe("2.0.0");
    expect(query.mock.calls[0][0]).toContain("project_id = $2");
    expect(query.mock.calls[0][1]).toEqual(["owner", "proj"]);
  });

  it("inserts the project with the release", async () => {
    const { query, pool: p } = pool([{ id: "r1" }]);
    await saveReleaseHistory(p, "owner", "proj", { release: { version: "1.0.0" } as never });
    expect(query.mock.calls[0][0]).toContain("project_id");
    expect(query.mock.calls[0][1].slice(0, 2)).toEqual(["owner", "proj"]);
  });

  it("finds an existing release inside the project only", async () => {
    const { query, pool: p } = pool([]);
    await findReleaseId(p, "owner", "proj", { version: "1.0.0" });
    expect(query.mock.calls[0][0]).toContain("project_id = $2");
    expect(query.mock.calls[0][1].slice(0, 2)).toEqual(["owner", "proj"]);
  });

  it("filters the History list by project and joins the project name", async () => {
    const { query, pool: p } = pool([]);
    await listReleaseHistory(p, "owner", { format: "markdown", limit: 10, projectId: "proj" });
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("p.name as project_name");
    expect(sql).toContain("h.project_id = $2");
    expect(params.slice(0, 2)).toEqual(["owner", "proj"]);
  });

  it("does not filter by project when none is given", async () => {
    const { query, pool: p } = pool([]);
    await listReleaseHistory(p, "owner", { format: "markdown", limit: 10 });
    expect(query.mock.calls[0][0]).not.toContain("h.project_id = $");
  });
});
