import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import Button, { ButtonSize, ButtonVariant } from './Button.tsx';

interface ConfirmDialogProps {
  isOpen: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  confirmingLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  isOpen,
  icon,
  title,
  description,
  confirmLabel,
  confirmingLabel = confirmLabel,
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const handleCancel = () => {
    if (isConfirming) return;
    onCancel();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isConfirming) onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isConfirming, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-busy={isConfirming}
        aria-labelledby="confirm-dialog-title"
        className="bg-surface-container-lowest w-[420px] rounded-2xl p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-error-rose/10 text-error-rose flex size-10 items-center justify-center rounded-xl">
          {icon}
        </div>
        <h2
          id="confirm-dialog-title"
          className="text-headline-md text-on-surface mt-4 font-semibold"
        >
          {title}
        </h2>
        <p className="text-body-md text-on-surface-variant mt-1.5">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            onClick={handleCancel}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button
            variant={ButtonVariant.Danger}
            size={ButtonSize.Sm}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming && <Loader2 className="size-3.5 animate-spin" />}
            {isConfirming ? confirmingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
