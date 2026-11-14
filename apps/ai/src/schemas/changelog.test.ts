import { describe, expect, it } from "vitest";

import { ChangelogQuerySchema } from "./changelog";

describe("ChangelogQuerySchema", () => {
  it("defaults the limit and accepts no filters", () => {
    expect(ChangelogQuerySchema.parse({}).limit).toBe(50);
  });

  it("rejects a non YYYYMMDD date and a reversed range", () => {
    expect(ChangelogQuerySchema.safeParse({ from: "2026-11-01" }).success).toBe(false);
    expect(ChangelogQuerySchema.safeParse({ from: "20261130", to: "20261101" }).success).toBe(false);
    expect(ChangelogQuerySchema.safeParse({ from: "20261101", to: "20261101" }).success).toBe(true);
  });
});
