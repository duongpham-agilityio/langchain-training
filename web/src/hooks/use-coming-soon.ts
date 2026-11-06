import { useComingSoonStore } from '@/store/coming-soon-store.ts';

export interface UseComingSoonResult {
  showComingSoon: (feature: string) => void;
}

// For buttons whose behavior is not built yet: clicking them opens
// ComingSoonDialog instead of silently doing nothing.
export const useComingSoon = (): UseComingSoonResult => {
  const showComingSoon = useComingSoonStore((state) => state.showComingSoon);
  return { showComingSoon };
};
