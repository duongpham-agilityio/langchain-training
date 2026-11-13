import { z } from 'zod';
import { RELEASE_FORMAT_LABELS, ReleaseSchema } from '@training/contracts';
import type { ReleaseNotesDraft } from '@/types/release-notes-draft.ts';

// What apps/ai `renderReleaseNotesPreview` returns, as a JSON string. Three shapes:
// rendered, unknown format, over the format's length limit (no text at all).
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
    return { kind: 'invalid', detail: 'The tool returned an unexpected result.' };
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
  if (!result.ok) {
    return {
      kind: 'refused',
      message:
        'supportedFormats' in result
          ? `${result.error} Supported formats: ${result.supportedFormats.join(', ')}.`
          : result.error,
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
