import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useComingSoonStore } from '@/store/coming-soon-store.ts';
import Button, { ButtonSize, ButtonVariant } from './Button.tsx';

// Mounted once in App, next to ToastViewport; opened through useComingSoon().
const ComingSoonDialog = () => {
  const feature = useComingSoonStore((state) => state.feature);
  const dismiss = useComingSoonStore((state) => state.dismissComingSoon);

  useEffect(() => {
    if (!feature) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feature, dismiss]);

  if (!feature) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coming-soon-dialog-title"
        className="bg-surface-container-lowest w-[420px] rounded-2xl p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-primary-soft text-primary flex size-10 items-center justify-center rounded-xl">
          <Sparkles className="size-4.75" />
        </div>
        <h2
          id="coming-soon-dialog-title"
          className="text-headline-md text-on-surface mt-4 font-semibold"
        >
          Coming soon
        </h2>
        <p className="text-body-md text-on-surface-variant mt-1.5">
          <span className="text-on-surface font-semibold">{feature}</span> isn’t
          available yet. It will be supported in a future update.
        </p>
        <div className="mt-6 flex justify-end">
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Sm}
            onClick={dismiss}
            autoFocus
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonDialog;
