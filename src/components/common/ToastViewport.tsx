import { useToastStore } from '@/store/toast-store.ts';
import Toast from './Toast.tsx';

const ToastViewport = () => {
  const toast = useToastStore((state) => state.toast);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (!toast) return null;

  return <Toast toast={toast} onDismiss={dismissToast} />;
};

export default ToastViewport;
