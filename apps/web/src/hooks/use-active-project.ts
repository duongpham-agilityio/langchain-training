import type { Project } from '@training/contracts';
import { useProjectStore } from '@/store/project-store.ts';
import { useProjects } from './use-projects.ts';

interface UseActiveProjectResult {
  projects: Project[] | undefined;
  isProjectsLoading: boolean;
  // The stored project when it is still in the list, else the first one, else
  // undefined (no project yet: the create-project gate is showing).
  activeProject: Project | undefined;
  setActiveProjectId: (projectId: string) => void;
}

export const useActiveProject = (): UseActiveProjectResult => {
  const { projects, isLoading } = useProjects();
  const storedId = useProjectStore((state) => state.activeProjectId);
  const setActiveProjectId = useProjectStore((state) => state.setActiveProjectId);

  const activeProject =
    projects?.find((project) => project.id === storedId) ?? projects?.at(0);

  return {
    projects,
    isProjectsLoading: isLoading,
    activeProject,
    setActiveProjectId,
  };
};
