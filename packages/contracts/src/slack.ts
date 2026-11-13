import { z } from "zod";
import { SLACK_MAX_CONTENT_LENGTH } from "./constants";

export const SlackPublishRequestSchema = z.object({
  platformId: z.string().min(1),
  label: z.string().min(1),
  content: z.string().min(1).max(SLACK_MAX_CONTENT_LENGTH),
});

export type SlackPublishRequest = z.infer<typeof SlackPublishRequestSchema>;
