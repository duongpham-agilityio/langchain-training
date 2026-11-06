import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react';
import { ToastKind, type ToastRecord } from '@/store/toast-store.ts';

interface ToastProps {
  toast: ToastRecord;
  onDismiss: () => void;
}

const renderIcon = (kind: ToastKind): ReactNode => {
  switch (kind) {
    case ToastKind.Success:
      return <CheckCircle2 className="text-success-emerald size-[18px]" />;
    case ToastKind.Info:
      return <Info className="text-primary-container size-[18px]" />;
    case ToastKind.Progress:
      return <Loader2 className="text-primary-container size-[17px] animate-spin" />;
    case ToastKind.Warning:
      return <AlertTriangle className="text-warning-purple size-[18px]" />;
    case ToastKind.Error:
      return <XCircle className="text-error-rose size-[18px]" />;
  }
};

const Toast = ({ toast, onDismiss }: ToastProps) => (
  <div
    role="status"
    aria-live="polite"
    className="bg-inverse-surface text-inverse-on-surface fixed right-6 bottom-6 z-40 flex w-[372px] items-start gap-3 rounded-xl px-4 py-3.5 shadow-2xl"
  >
    <span className="flex size-5 shrink-0 items-center justify-center">
      {renderIcon(toast.kind)}
    </span>
    <div className="min-w-0 flex-1">
      <div className="text-body-md font-semibold">{toast.title}</div>
      {toast.description && (
        <div className="text-label-sm mt-0.5 opacity-70">{toast.description}</div>
      )}
    </div>
    {toast.actionLabel && toast.onAction && (
      <button
        type="button"
        onClick={toast.onAction}
        className="text-label-sm text-primary-container shrink-0 cursor-pointer font-semibold hover:opacity-80"
      >
        {toast.actionLabel}
      </button>
    )}
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss notification"
      className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md opacity-50 hover:opacity-100"
    >
      <X className="size-3.5" />
    </button>
  </div>
);

export default Toast;
