import { z } from "zod";

/** One project. Every thread and every stored release belongs to exactly one. */
export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Project = z.infer<typeof ProjectSchema>;
