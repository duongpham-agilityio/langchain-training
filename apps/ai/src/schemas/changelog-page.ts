import { z } from "zod";

export const publishChangelogPageSchema = z.object({
  title: z.string().trim().min(1).max(120).describe("Short page title, e.g. 'Releases in September 2026'."),
  html: z
    .string()
    .min(1)
    .describe(
      "One complete, self-contained HTML document starting with <!doctype html>, with inline CSS and JS only, built only from the releases `getChangelog` returned.",
    ),
});
