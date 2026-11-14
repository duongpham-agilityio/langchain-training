import { z } from 'zod';
import {
  ChangelogAnswerResultSchema,
  RELEASE_FORMAT_LABELS,
  ReleaseSchema,
} from '@training/contracts';
import type { ReleaseNotesDraft } from '@/types/release-notes-draft.ts';

// What apps/ai `renderReleaseNotesPreview` returns, as a JSON string. Three shapes:
// rendered, unknown format (refused), over the format's length limit (a draft
// with the error and no text).
const RenderedSchema = z.object({
  ok: z.literal(true),
  release: ReleaseSchema,
  format: z.string().min(1),
  text: z.string().min(1),
  hash: z.string(),
  subject: z.string().min(1).optional(),
});

const UnsupportedFormatSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  supportedFormats: z.array(z.string()),
});

const OverLimitSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  release: ReleaseSchema,
  hash: z.string(),
});

const ReleasePreviewResultSchema = z.union([
  RenderedSchema,
  UnsupportedFormatSchema,
  OverLimitSchema,
]);

export type ReleasePreviewResult = z.infer<typeof ReleasePreviewResultSchema>;

export type ReleasePreviewOutcome =
  // No result yet: render nothing.
  | { kind: 'pending' }
  | { kind: 'draft'; draft: ReleaseNotesDraft }
  | { kind: 'refused'; message: string }
  // The tool itself failed (e.g. a database error): its result is plain error
  // text, not JSON.
  | { kind: 'failed'; message: string }
  | { kind: 'invalid'; detail: string };

// The over-limit result names no format, so its draft has none either.
export const OVER_LIMIT_PLATFORM = 'none';

const MAX_FAILURE_LENGTH = 300;

const parseJson = (raw: string): { value: unknown } | null => {
  try {
    return { value: JSON.parse(raw) };
  } catch {
    return null;
  }
};

// Turns the tool's raw result into what the chat shows. A refusal is a normal
// answer from the tool, not unusable data, so it gets its own outcome.
export const parseReleasePreviewResult = (
  raw: unknown,
): ReleasePreviewOutcome => {
  if (raw === undefined || raw === null || raw === '') {
    return { kind: 'pending' };
  }
  if (typeof raw !== 'string') {
    return {
      kind: 'invalid',
      detail: 'The tool returned an unexpected result.',
    };
  }

  const json = parseJson(raw);
  if (!json) {
    return { kind: 'failed', message: raw.trim().slice(0, MAX_FAILURE_LENGTH) };
  }

  const parsed = ReleasePreviewResultSchema.safeParse(json.value);
  if (!parsed.success) {
    return { kind: 'invalid', detail: parsed.error.message };
  }

  const result = parsed.data;
  if (!result.ok && 'release' in result) {
    // Over the format's length limit: a draft with the error and no text, so
    // the Live Preview shows the error and the card still opens it.
    return {
      kind: 'draft',
      draft: {
        releaseDate: result.release.date,
        version: result.release.version,
        title: result.release.openingLine,
        platform: OVER_LIMIT_PLATFORM,
        label: 'Over the length limit',
        content: '',
        renderError: result.error,
        release: result.release,
        hash: result.hash,
      },
    };
  }
  if (!result.ok) {
    return {
      kind: 'refused',
      message: `${result.error} Supported formats: ${result.supportedFormats.join(', ')}.`,
    };
  }

  return {
    kind: 'draft',
    draft: {
      releaseDate: result.release.date,
      version: result.release.version,
      // History needs a title; the opening line is the release's one-line summary.
      title: result.release.openingLine,
      subject: result.subject,
      platform: result.format,
      // `format` is any string here: an unknown one falls back to its id.
      label:
        (RELEASE_FORMAT_LABELS as Record<string, string>)[result.format] ??
        result.format,
      content: result.text,
      release: result.release,
      hash: result.hash,
    },
  };
};

const EditRefusalSchema = z.object({ ok: z.literal(false), error: z.string() });

// What apps/ai `editReleaseItem` returns after an Accept: the new draft in the same shape as the
// preview tool, or `{ ok: false, error }` when the edit was refused (outdated draft, unknown item).
export const parseEditReleaseItemResult = (
  raw: unknown,
): ReleasePreviewOutcome => {
  const json = typeof raw === 'string' ? parseJson(raw) : null;
  const refusal = EditRefusalSchema.safeParse(json?.value);
  if (refusal.success && !('release' in (json?.value as object))) {
    return { kind: 'refused', message: refusal.data.error };
  }
  return parseReleasePreviewResult(raw);
};

const AnswerRefusalSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
});

export const CHANGELOG_ANSWER_LABEL = 'Changelog answer';

// What apps/ai `showChangelogAnswer` returns: a Markdown answer for the Live Preview. It is a draft
// without `release`/`hash`/`version`, so it cannot be archived, edited or sent as release notes.
export const parseChangelogAnswerResult = (
  raw: unknown,
): ReleasePreviewOutcome => {
  if (raw === undefined || raw === null || raw === '') {
    return { kind: 'pending' };
  }
  const json = typeof raw === 'string' ? parseJson(raw) : null;
  if (!json) {
    return typeof raw === 'string'
      ? { kind: 'failed', message: raw.trim().slice(0, MAX_FAILURE_LENGTH) }
      : { kind: 'invalid', detail: 'The tool returned an unexpected result.' };
  }
  const refusal = AnswerRefusalSchema.safeParse(json.value);
  if (refusal.success) {
    return { kind: 'refused', message: refusal.data.error };
  }
  const parsed = ChangelogAnswerResultSchema.safeParse(json.value);
  if (!parsed.success) {
    return { kind: 'invalid', detail: parsed.error.message };
  }
  return {
    kind: 'draft',
    draft: {
      title: parsed.data.title,
      platform: 'markdown',
      label: CHANGELOG_ANSWER_LABEL,
      content: parsed.data.markdown,
    },
  };
};
