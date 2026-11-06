import { z } from 'zod';
import { PlatformDraftSchema, ReleaseNotesDraftSchema } from './release-notes-draft';

// One archive = one platform draft, the same `{platform, label, content}` slot
// the Live Preview shows. Archiving the same version again creates a new record.
export const SaveReleaseHistoryRequestSchema = z.object({
  releaseDate: ReleaseNotesDraftSchema.shape.releaseDate,
  titleOverride: ReleaseNotesDraftSchema.shape.titleOverride,
  version: z.string().min(1),
  title: z.string().min(1),
  ...PlatformDraftSchema.shape,
});

export type SaveReleaseHistoryRequest = z.infer<
  typeof SaveReleaseHistoryRequestSchema
>;
