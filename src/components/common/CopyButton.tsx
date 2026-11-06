import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import Button, { ButtonVariant } from './Button.tsx';

const COPY_FEEDBACK_DURATION_MS = 2000;

const enum CopyState {
  Idle = 'idle',
  Copied = 'copied',
  Failed = 'failed',
}

export type CopyHandler = () => void | boolean | Promise<void | boolean>;

interface CopyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onCopy: CopyHandler;
  variant?: ButtonVariant;
  // Drops the label so the button reads as one of the design's 32px
  // `.btn-icon` squares; the icon still swaps to show the result.
  isIconOnly?: boolean;
  children?: ReactNode;
}

const CopyButton = ({
  onCopy,
  variant = ButtonVariant.Ghost,
  isIconOnly = false,
  className,
  children = 'Copy',
  ...rest
}: CopyButtonProps) => {
  const [state, setState] = useState<CopyState>(CopyState.Idle);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const runCopy = async (): Promise<boolean> => {
    try {
      return (await onCopy()) !== false;
    } catch (error) {
      console.error('[CopyButton] onCopy threw', error);
      return false;
    }
  };

  const handleClick = async () => {
    const succeeded = await runCopy();

    if (!isMountedRef.current) return;

    setState(succeeded ? CopyState.Copied : CopyState.Failed);
    clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(
      () => isMountedRef.current && setState(CopyState.Idle),
      COPY_FEEDBACK_DURATION_MS,
    );
  };

  const isCopied = state === CopyState.Copied;
  const isFailed = state === CopyState.Failed;

  return (
    <Button
      variant={variant}
      aria-label={isIconOnly ? 'Copy' : undefined}
      className={cn(
        isFailed && 'text-error',
        isIconOnly &&
          'text-on-surface-muted hover:bg-surface-container hover:text-on-surface inline-flex size-8 items-center justify-center rounded-lg bg-transparent p-0',
        className,
      )}
      {...rest}
      onClick={() => void handleClick()}
    >
      <span className="inline-flex items-center gap-2">
        <span className="relative inline-flex size-4 shrink-0">
          <Copy
            className={cn(
              'absolute inset-0 size-4 transition-all duration-200 ease-out',
              state === CopyState.Idle
                ? 'scale-100 opacity-100'
                : 'scale-50 opacity-0',
            )}
          />
          <Check
            className={cn(
              'absolute inset-0 size-4 transition-all duration-200 ease-out',
              isCopied ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
            )}
          />
          <X
            className={cn(
              'absolute inset-0 size-4 transition-all duration-200 ease-out',
              isFailed ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
            )}
          />
        </span>
        {!isIconOnly && (isCopied ? 'Copied' : isFailed ? 'Copy failed' : children)}
      </span>
    </Button>
  );
};

export default CopyButton;
