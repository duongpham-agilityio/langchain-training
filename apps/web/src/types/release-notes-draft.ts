import { z } from 'zod';
import { ReleaseSchema } from '@/types/release-object.ts';

// One rendered format of a release: the slot the Live Preview, History and
// Slack all share. Built client-side from the renderReleaseNotesPreview result
// (see release-preview-result.ts), no longer filled in by the model.
export const PlatformDraftSchema = z.object({
  platform: z.string().min(1),
  label: z.string().min(1),
  content: z.string().min(1),
});

export type PlatformDraft = z.infer<typeof PlatformDraftSchema>;

export const ReleaseNotesDraftSchema = z.object({
  releaseDate: z
    .string()
    .regex(/^\d{8}$/)
    .nullish(),
  titleOverride: z.string().min(1).nullish(),
  version: z.string().min(1).nullish(),
  title: z.string().min(1).nullish(),
  // Only the html-email format has a subject line.
  subject: z.string().min(1).nullish(),
  // The release object and its hash from the tool result, sent back to the agent as context so an
  // edit request on a reopened draft is built from that draft. Optional: older stored drafts lack them.
  release: ReleaseSchema.optional(),
  hash: z.string().optional(),
  ...PlatformDraftSchema.shape,
});

export type ReleaseNotesDraft = z.infer<typeof ReleaseNotesDraftSchema>;
