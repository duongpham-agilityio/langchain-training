import { z } from "zod";

export const RELEASE_SEND_CHANNELS = ["slack", "email"] as const;
/** `pending` and `sending` are scheduled jobs not yet finished; `cancelled` is a job the user cancelled. */
export const RELEASE_SEND_ENTRY_STATUSES = ["sent", "failed", "pending", "sending", "cancelled"] as const;

/**
 * One line of a release's send list: a finished send (`kind: "send"`) or a scheduled job that has not
 * finished (`kind: "scheduled"`). `at` is an ISO instant: when it was sent, or when it is due to run.
 * `timeZone` is the job's own IANA zone (null for finished sends); the web shows times in the viewer's zone.
 */
export const ReleaseSendEntrySchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["send", "scheduled"]),
  channel: z.enum(RELEASE_SEND_CHANNELS),
  recipient: z.string(),
  status: z.enum(RELEASE_SEND_ENTRY_STATUSES),
  at: z.string(),
  timeZone: z.string().nullable(),
  error: z.string().nullable(),
});

export type ReleaseSendEntry = z.infer<typeof ReleaseSendEntrySchema>;

export const ListReleaseSendsResponseSchema = z.object({
  sends: z.array(ReleaseSendEntrySchema),
});

export type ListReleaseSendsResponse = z.infer<typeof ListReleaseSendsResponseSchema>;

export const CancelScheduledSendResponseSchema = z.object({ id: z.string().min(1), status: z.literal("cancelled") });

export type CancelScheduledSendResponse = z.infer<typeof CancelScheduledSendResponseSchema>;
