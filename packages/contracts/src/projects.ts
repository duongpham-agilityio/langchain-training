import { z } from "zod";

/** One project. Every thread and every stored release belongs to exactly one. */
export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Project = z.infer<typeof ProjectSchema>;

/** Route path both apps agree on. */
export const PROJECTS_PATH = "/api/projects";

/** Longest project name the server accepts (after trim). */
export const PROJECT_NAME_MAX_LENGTH = 80;

export const CreateProjectRequestSchema = z.object({
  name: z.string().trim().min(1).max(PROJECT_NAME_MAX_LENGTH),
});

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

export const ListProjectsResponseSchema = z.object({
  projects: z.array(ProjectSchema),
});

export type ListProjectsResponse = z.infer<typeof ListProjectsResponseSchema>;
