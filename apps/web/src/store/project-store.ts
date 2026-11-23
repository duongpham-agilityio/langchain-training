import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProjectStoreState {
  // Last project the user worked in. May name a project that no longer exists
  // or belongs to another account on this browser: use-active-project checks it
  // against the loaded list before anything uses it.
  activeProjectId: string | null;
  setActiveProjectId: (projectId: string | null) => void;
}

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set) => ({
      activeProjectId: null,
      setActiveProjectId: (activeProjectId) => set({ activeProjectId }),
    }),
    { name: 'release-copilot-active-project' },
  ),
);
