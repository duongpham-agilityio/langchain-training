import type { ReleaseSendEntry } from "@training/contracts";

export type ReleaseSendRow = {
  id: string;
  channel: "slack" | "email";
  recipient: string;
  status: "pending" | "sent" | "failed";
  sent_at: Date | string | null;
  created_at: Date | string;
  error: string | null;
};

export type ScheduledSendRow = {
  id: string;
  status: "pending" | "sending" | "sent" | "failed" | "cancelled";
  run_at: Date | string;
  time_zone: string;
  error: string | null;
};

const iso = (value: Date | string): string => new Date(value).toISOString();

/**
 * Merges finished sends and open scheduled jobs into one list, newest first.
 * A job that ended `sent` or `failed` is already a `release_sends` row (the poller records it), so it is
 * skipped here; showing both would list the same send twice. A failed job's error comes from that row.
 */
export const buildReleaseSendEntries = (
  sends: ReleaseSendRow[],
  jobs: ScheduledSendRow[],
): ReleaseSendEntry[] => {
  const sendEntries = sends
    .filter((s) => s.status !== "pending")
    .map(
      (s): ReleaseSendEntry => ({
        id: s.id,
        kind: "send",
        channel: s.channel,
        recipient: s.recipient,
        status: s.status as "sent" | "failed",
        at: iso(s.sent_at ?? s.created_at),
        timeZone: null,
        error: s.error,
      }),
    );
  const jobEntries = jobs
    .filter((j) => j.status === "pending" || j.status === "sending" || j.status === "cancelled")
    .map(
      (j): ReleaseSendEntry => ({
        id: j.id,
        kind: "scheduled",
        channel: "slack",
        recipient: "",
        status: j.status as "pending" | "sending" | "cancelled",
        at: iso(j.run_at),
        timeZone: j.time_zone,
        error: j.error,
      }),
    );
  return [...sendEntries, ...jobEntries].sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id));
};
