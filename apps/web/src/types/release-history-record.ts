import { z } from 'zod';
import { PlatformDraftSchema } from './release-notes-draft';
import { ReleaseEntrySchema } from './release-entry';
import { ReleaseStatus } from './release';

export const ReleaseHistoryRecordSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  releaseDate: z.string().regex(/^\d{8}$/),
  titleOverride: z.string().nullable(),
  status: z.enum([
    ReleaseStatus.Draft,
    ReleaseStatus.Published,
    ReleaseStatus.Archived,
  ]),
  github: z.string(),
  appStore: z.string().nullable(),
  googlePlay: z.string().nullable(),
  platforms: z.array(PlatformDraftSchema),
  entries: z.array(ReleaseEntrySchema),
  featCount: z.number().int(),
  fixCount: z.number().int(),
  createdAt: z.string(),
});

export type ReleaseHistoryRecord = z.infer<typeof ReleaseHistoryRecordSchema>;

export const ListReleaseHistoryResponseSchema = z.object({
  releases: z.array(ReleaseHistoryRecordSchema),
  nextCursor: z.string().nullable(),
});

export type ListReleaseHistoryResponse = z.infer<
  typeof ListReleaseHistoryResponseSchema
>;
