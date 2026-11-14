import { describe, expect, it } from "vitest";

import { buildReleaseSendEntries, type ReleaseSendRow, type ScheduledSendRow } from "./release-send-entries";

const send = (over: Partial<ReleaseSendRow>): ReleaseSendRow => ({
  id: "s1",
  channel: "slack",
  recipient: "",
  status: "sent",
  sent_at: "2026-11-10T09:00:00.000Z",
  created_at: "2026-11-10T09:00:01.000Z",
  error: null,
  ...over,
});
const job = (over: Partial<ScheduledSendRow>): ScheduledSendRow => ({
  id: "j1",
  status: "pending",
  run_at: "2026-11-20T01:00:00.000Z",
  time_zone: "Asia/Ho_Chi_Minh",
  error: null,
  ...over,
});

describe("buildReleaseSendEntries", () => {
  it("lists a pending job with its due instant and zone, newest first", () => {
    const out = buildReleaseSendEntries([send({})], [job({})]);
    expect(out.map((e) => e.id)).toEqual(["j1", "s1"]);
    expect(out[0]).toMatchObject({ kind: "scheduled", status: "pending", at: "2026-11-20T01:00:00.000Z", timeZone: "Asia/Ho_Chi_Minh" });
  });

  it("keeps the error of a failed send", () => {
    const out = buildReleaseSendEntries([send({ status: "failed", sent_at: null, error: "boom" })], []);
    expect(out[0]).toMatchObject({ status: "failed", error: "boom", at: "2026-11-10T09:00:01.000Z" });
  });

  it("does not list a finished job twice (its send row is the record)", () => {
    const out = buildReleaseSendEntries([send({})], [job({ status: "sent" }), job({ id: "j2", status: "failed", error: "x" })]);
    expect(out.map((e) => e.id)).toEqual(["s1"]);
  });

  it("keeps cancelled jobs and drops pending send rows", () => {
    const out = buildReleaseSendEntries([send({ status: "pending" })], [job({ status: "cancelled" })]);
    expect(out.map((e) => [e.id, e.status])).toEqual([["j1", "cancelled"]]);
  });
});
