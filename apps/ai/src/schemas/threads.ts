import { z } from "zod";

// Same shape as the web `ListThreadsResponseSchema` (apps/web/src/types/thread.ts).
// `resourceId` is the owner's user id.
export const ThreadSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  resourceId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ListThreadsResponseSchema = z.object({
  threads: z.array(ThreadSummarySchema),
});

export type ThreadSummary = z.infer<typeof ThreadSummarySchema>;
export type ListThreadsResponse = z.infer<typeof ListThreadsResponseSchema>;
