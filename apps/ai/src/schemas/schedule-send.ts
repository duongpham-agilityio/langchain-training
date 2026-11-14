import { ReleaseSchema, ScheduleSendToolInputSchema } from "@training/contracts";

export { type ScheduleSendToolInput } from "@training/contracts";

/** Model-facing input: `describe` text stays here, on top of the shared schema. */
export const ScheduleReleaseSendInputSchema = ScheduleSendToolInputSchema.extend({
  release: ReleaseSchema.describe(
    "The release object of the rendered draft (the `release` of the tool result), copied unchanged. The server renders the Slack text from it; never pass text.",
  ),
  localDateTime: ScheduleSendToolInputSchema.shape.localDateTime.describe(
    "When to send, as the user's LOCAL date-time without offset or zone, like 2026-11-16T09:00 (24-hour). Resolve 'today', 'tomorrow' and weekdays from getCurrentDateTime. Never convert time zones yourself.",
  ),
});
