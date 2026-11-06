import { z } from 'zod';
import { joinLines } from '../lib/text';

export const PlatformDraftSchema = z.object({
  platform: z
    .string()
    .min(1)
    .describe(
      joinLines(
        'Kebab-case identifier of the destination the user named, normalized',
        'from their own words. No fixed list — any destination is valid.',
        'Never guess this field, and never fall back to the most common or',
        'most likely destination. When the user named none and no existing',
        'draft in this conversation supplies one, do not call this tool at',
        'all: ask which destination they want first.',
      ),
    ),
  label: z
    .string()
    .min(1)
    .describe(
      joinLines(
        'Display name for that same destination, e.g. "GitHub", "Customer',
        'Email". Must denote the same destination as `platform` — never name',
        'a different one than the content was written for.',
      ),
    ),
  content: z
    .string()
    .min(1)
    .describe(
      joinLines(
        'The rendered body for this one destination. Never write a title',
        "line — the app prepends it. No repo-enforced length limit and no",
        'built-in format table: derive the markup, length, and audience',
        'conventions from your own knowledge of the destination named in',
        '`platform`.',
      ),
    ),
});

export type PlatformDraft = z.infer<typeof PlatformDraftSchema>;

export const ReleaseNotesDraftSchema = z.object({
  releaseDate: z
    .string()
    .regex(/^\d{8}$/)
    .nullish()
    .describe(
      joinLines(
        'The release date as yyyymmdd (e.g. 20260901), normalized from whatever',
        'the user wrote. Set it ONLY when the user named a release date;',
        'ambiguous slash dates are day-first (1/9/2026 is 1 September 2026).',
        'Omit this field entirely when the user gave no date — the app then',
        "fills in today's date itself. Never guess a date.",
      ),
    ),
  titleOverride: z
    .string()
    .min(1)
    .describe(
      joinLines(
        'A replacement for the whole title line, used verbatim. Set it ONLY when',
        'the user explicitly asked for a different title (e.g. "title it v2.1.0',
        'Release"). Omit it otherwise — the app then builds a default title',
        'itself.',
      ),
    )
    .nullish(),
  version: z
    .string()
    .min(1)
    .nullish()
    .describe(
      joinLines(
        'MAJOR.MINOR.PATCH for this release, decided by you from conversation',
        'context: bump the version last saved for the release currently in',
        'progress, or start over at "1.0.0" when this build is for a clearly',
        'different set of commits/PRs than the one you were just iterating on.',
        'Omit only when you have no basis yet to decide — omitting suppresses',
        'saving this build to History.',
      ),
    ),
  title: z
    .string()
    .min(1)
    .nullish()
    .describe(
      joinLines(
        'A short label distinguishing this release from others built the same',
        'day (e.g. "Payment Gateway Update"). Required alongside `version` for',
        'this build to be saved to History — omit both together, never just one.',
      ),
    ),
  ...PlatformDraftSchema.shape,
});

export type ReleaseNotesDraft = z.infer<typeof ReleaseNotesDraftSchema>;
