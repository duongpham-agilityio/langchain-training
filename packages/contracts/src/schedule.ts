import { z } from "zod";
import { ReleaseSchema } from "./release";

/** Local date-time without offset or zone, minutes precision: `2026-11-16T09:00`. */
export const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * Input of the chat tool that schedules a Slack send: the draft's release object and a local
 * date-time. The server converts it with the browser time zone; the model never does zone math.
 */
export const ScheduleSendToolInputSchema = z.object({
  release: ReleaseSchema,
  localDateTime: z.string().regex(LOCAL_DATE_TIME_PATTERN),
});

export type ScheduleSendToolInput = z.infer<typeof ScheduleSendToolInputSchema>;
