import { useToastStore } from '@/store/toast-store.ts';
import type { ToastRecord } from '@/store/toast-store.ts';

export interface UseToastResult {
  showToast: (toast: Omit<ToastRecord, 'id'>) => void;
}

export const useToast = (): UseToastResult => {
  const showToast = useToastStore((state) => state.showToast);
  return { showToast };
};
