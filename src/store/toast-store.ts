import { create } from 'zustand';
import { createUUID } from '@/lib/uuid.ts';

export const enum ToastKind {
  Success = 'success',
  Info = 'info',
  Progress = 'progress',
  Warning = 'warning',
  Error = 'error',
}

export interface ToastRecord {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastStoreState {
  toast: ToastRecord | null;
  showToast: (toast: Omit<ToastRecord, 'id'>) => void;
  dismissToast: () => void;
}

const AUTO_DISMISS_MS = 5000;
const PERSISTENT_KINDS: ReadonlySet<ToastKind> = new Set([
  ToastKind.Progress,
  ToastKind.Error,
]);

let dismissTimeoutId: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastStoreState>()((set) => ({
  toast: null,
  showToast: (toast) => {
    clearTimeout(dismissTimeoutId);
    const id = createUUID();
    set({ toast: { ...toast, id } });

    if (!PERSISTENT_KINDS.has(toast.kind)) {
      dismissTimeoutId = setTimeout(() => {
        set((state) => (state.toast?.id === id ? { toast: null } : state));
      }, AUTO_DISMISS_MS);
    }
  },
  dismissToast: () => {
    clearTimeout(dismissTimeoutId);
    set({ toast: null });
  },
}));
