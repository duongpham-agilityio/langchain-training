import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Project } from '@training/contracts';
import { PROJECTS_QUERY_KEY } from '@/constants/query-keys.ts';
import { createProject } from '@/services/create-project.ts';
import { listProjects } from '@/services/list-projects.ts';

interface UseProjectsResult {
  projects: Project[] | undefined;
  isLoading: boolean;
  isError: boolean;
  create: (name: string) => Promise<Project>;
  isCreating: boolean;
  createError: Error | null;
}

export const useProjects = (): UseProjectsResult => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: listProjects,
  });

  const mutation = useMutation({
    mutationFn: (name: string) => createProject({ name }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY }),
  });

  return {
    projects: data,
    isLoading,
    isError,
    create: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
  };
};
