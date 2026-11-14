import { ReleaseSchema, SlackPublishToolInputSchema } from "@training/contracts";

export {
  SlackPublishRequestSchema,
  type SlackPublishRequest,
  type SlackPublishToolInput,
} from "@training/contracts";

/** Model-facing input: `describe` text stays here, on top of the shared schema. */
export const PublishReleaseNotesToSlackInputSchema = SlackPublishToolInputSchema.extend({
  release: ReleaseSchema.describe(
    "The release object of the rendered Slack draft (the `release` of the tool result), copied unchanged. The server renders the Slack text from it; never pass text.",
  ),
});
