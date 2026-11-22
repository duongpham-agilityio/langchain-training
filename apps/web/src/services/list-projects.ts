import {
  ListProjectsResponseSchema,
  PROJECTS_PATH,
  type Project,
} from '@training/contracts';
import { releaseCopilotHttpClient } from '@/services/http-client.ts';

export const listProjects = async (): Promise<Project[]> => {
  const body = await releaseCopilotHttpClient.get(PROJECTS_PATH, {
    target: 'the projects list',
  });

  const parsed = ListProjectsResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `The projects route returned an unexpected shape: ${parsed.error.message}`,
    );
  }

  return parsed.data.projects;
};
