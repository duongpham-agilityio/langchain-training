import { create } from 'zustand';

interface ComingSoonStoreState {
  // Name of the action the user tried, e.g. "Rename thread"; null = closed.
  feature: string | null;
  showComingSoon: (feature: string) => void;
  dismissComingSoon: () => void;
}

export const useComingSoonStore = create<ComingSoonStoreState>()((set) => ({
  feature: null,
  showComingSoon: (feature) => set({ feature }),
  dismissComingSoon: () => set({ feature: null }),
}));
