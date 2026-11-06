import { z } from 'zod';

export const ThreadSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  resourceId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ThreadSummary = z.infer<typeof ThreadSummarySchema>;

export const ListThreadsResponseSchema = z.object({
  threads: z.array(ThreadSummarySchema),
});
