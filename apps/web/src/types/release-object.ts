import { z } from 'zod';
import { ReleaseChangeSchema } from './release-change';

// Mirrors apps/ai `ReleaseSchema`.
export const ReleaseSchema = z.object({
  version: z.string().min(1),
  date: z.string().regex(/^\d{8}$/),
  openingLine: z.string().trim().min(1),
  changes: z.array(ReleaseChangeSchema),
});

export type Release = z.infer<typeof ReleaseSchema>;
