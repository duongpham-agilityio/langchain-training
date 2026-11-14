import { z } from "zod";

export const showChangelogAnswerSchema = z.object({
  title: z.string().min(1).max(120).describe("Short title, e.g. 'Fixes released in September 2026'."),
  markdown: z
    .string()
    .min(1)
    .describe(
      "The answer as Markdown, built only from the releases `getChangelog` returned. When it returned none, say that nothing was found for the range.",
    ),
});
