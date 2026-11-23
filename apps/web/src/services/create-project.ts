import {
  PROJECTS_PATH,
  ProjectSchema,
  type CreateProjectRequest,
  type Project,
} from '@training/contracts';
import { releaseCopilotHttpClient } from '@/services/http-client.ts';

export const createProject = async (
  request: CreateProjectRequest,
): Promise<Project> => {
  const body = await releaseCopilotHttpClient.post(PROJECTS_PATH, request, {
    target: 'the project create route',
  });

  const parsed = ProjectSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `The projects route returned an unexpected shape: ${parsed.error.message}`,
    );
  }

  return parsed.data;
};
