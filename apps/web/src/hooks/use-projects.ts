import { useQuery } from '@tanstack/react-query';
import type { Project } from '@training/contracts';
import { PROJECTS_QUERY_KEY } from '@/constants/query-keys.ts';
import { listProjects } from '@/services/list-projects.ts';

// The caller's projects, newest first; a failed load leaves the list empty.
export const useProjects = (): Project[] => {
  const query = useQuery({ queryKey: PROJECTS_QUERY_KEY, queryFn: listProjects });
  return query.data ?? [];
};
