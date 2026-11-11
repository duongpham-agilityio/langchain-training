import { z } from 'zod';

export const CHANGE_TYPES = [
  'feature',
  'fix',
  'performance',
  'docs',
  'internal',
  'other',
] as const;

export const ChangeTypeSchema = z.enum(CHANGE_TYPES);

export type ChangeType = z.infer<typeof ChangeTypeSchema>;

// Mirrors apps/ai `ChangeSchema`.
export const ReleaseChangeSchema = z.object({
  id: z.string().min(1),
  type: ChangeTypeSchema,
  breaking: z.boolean(),
  description: z
    .string()
    .trim()
    .min(1)
    .regex(/^[^\n\r]+$/, 'description must be one line'),
  refs: z.array(z.string().min(1)).optional(),
});

export type ReleaseChange = z.infer<typeof ReleaseChangeSchema>;
