import { z } from "zod";
import { ReleaseSchema } from "./release";

/** `POST /slack/publish`: the server loads the stored release and renders its Slack text itself. */
export const SlackPublishRequestSchema = z.object({
  releaseId: z.string().min(1),
});

export type SlackPublishRequest = z.infer<typeof SlackPublishRequestSchema>;

/** Input of the chat tool: the release object of the draft. The server saves it first when it is not saved yet. */
export const SlackPublishToolInputSchema = z.object({
  release: ReleaseSchema,
});

export type SlackPublishToolInput = z.infer<typeof SlackPublishToolInputSchema>;
