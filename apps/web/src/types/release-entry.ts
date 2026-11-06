import { z } from 'zod';
import { joinLines } from '../lib/text';

export const ReleaseEntrySchema = z.object({
  source: z
    .enum(['commit', 'pr'])
    .describe('Whether this entry came from a git log commit or a PR.'),
  id: z
    .string()
    .min(1)
    .describe(
      joinLines(
        'Unique identifier. For source "commit": the commit hash (git log',
        'placeholder %h short / %H full). For source "pr": the PR number.',
      ),
    ),
  author: z
    .string()
    .min(1)
    .describe(
      joinLines(
        'For source "commit": git log placeholder %an (name) or %ae (email).',
        'For source "pr": the PR author.',
      ),
    ),
  timestamp: z
    .string()
    .min(1)
    .describe(
      joinLines(
        'For source "commit": git log placeholder %ad or %aI (ISO 8601). For',
        'source "pr": the PR created/merged date.',
      ),
    ),
  title: z
    .string()
    .min(1)
    .describe(
      joinLines(
        'For source "commit": the subject line (git log placeholder %s). For',
        'source "pr": the PR title.',
      ),
    ),
  description: z
    .string()
    .nullable()
    .optional()
    .describe(
      joinLines(
        'Optional longer body — PR description, or a commit message body/footer',
        '(e.g. a BREAKING CHANGE: footer). Used for breaking-change detection.',
        'Omit this field, or send null, when there is no description.',
      ),
    ),
  type: z
    .string()
    .min(1)
    .describe(
      joinLines(
        'Required. The classification label for this entry: "feat", "fix",',
        '"chore", or a team-specific custom label — whatever best fits the',
        'classification rules applied. Never leave this blank or guess a value',
        "not backed by the entry's own text.",
      ),
    ),
  breaking: z
    .boolean()
    .describe(
      joinLines(
        'Required. Whether this entry is a breaking change, regardless of its',
        'type — a fix or a feat can both be breaking.',
      ),
    ),
});

export type ReleaseEntry = z.infer<typeof ReleaseEntrySchema>;
