import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useRuntimeConnection } from '@/hooks/use-runtime-connection.ts';
import Button, { ButtonSize, ButtonVariant } from './Button.tsx';

// Mounted once in App, next to ToastViewport. Opens when CopilotKit can't reach
// the runtime; dismissing keeps it closed until the connection recovers and
// fails again, so History stays usable while Release Builder is down.
const ConnectionErrorDialog = () => {
  const { hasConnectionError, errorMessage } = useRuntimeConnection();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!hasConnectionError && isDismissed) {
    setIsDismissed(false);
  }

  const isOpen = hasConnectionError && !isDismissed;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsDismissed(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => setIsDismissed(true)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="connection-error-dialog-title"
        aria-describedby="connection-error-dialog-description"
        className="bg-surface-container-lowest w-[420px] rounded-2xl p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-error-rose/10 text-error-rose flex size-10 items-center justify-center rounded-xl">
          <WifiOff className="size-4.75" />
        </div>
        <h2
          id="connection-error-dialog-title"
          className="text-headline-md text-on-surface mt-4 font-semibold"
        >
          Connection error
        </h2>
        <p
          id="connection-error-dialog-description"
          className="text-body-md text-on-surface-variant mt-1.5"
        >
          Can’t reach the Release Builder server, so chat is unavailable. Check your
          connection, then reload the page.
        </p>
        {errorMessage && (
          <p className="text-label-sm text-on-surface-variant/70 mt-2 font-mono break-words">
            {errorMessage}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            onClick={() => setIsDismissed(true)}
          >
            Dismiss
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Sm}
            onClick={() => window.location.reload()}
            autoFocus
          >
            Reload
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionErrorDialog;
