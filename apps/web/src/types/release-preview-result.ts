import { z } from 'zod';
import { RELEASE_FORMAT_LABELS } from '@/constants/release-formats.ts';
import { ReleaseSchema } from '@/types/release-object.ts';
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
  | { kind: 'draft'; draft: ReleaseNotesDraft }
  | { kind: 'refused'; message: string }
  | { kind: 'invalid'; detail: string };

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

// Turns the tool's raw result into what the chat shows. A refusal is a normal
// answer from the tool, not unusable data, so it gets its own outcome.
export const parseReleasePreviewResult = (
  raw: unknown,
): ReleasePreviewOutcome => {
  if (typeof raw !== 'string') {
    return { kind: 'invalid', detail: 'The tool returned no result.' };
  }

  const parsed = ReleasePreviewResultSchema.safeParse(parseJson(raw));
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
      label: RELEASE_FORMAT_LABELS[result.format] ?? result.format,
      content: result.text,
    },
  };
};
