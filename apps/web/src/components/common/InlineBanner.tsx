import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const enum BannerVariant {
  Warning = 'warning',
  Error = 'error',
  Info = 'info',
}

const VARIANT_CLASSES: Record<BannerVariant, string> = {
  [BannerVariant.Warning]: 'bg-warning-purple/10 border-warning-purple/30 text-warning-purple',
  [BannerVariant.Error]: 'bg-error-rose/10 border-error-rose/30 text-error-rose',
  [BannerVariant.Info]: 'bg-primary-container/20 border-primary-container/40 text-primary',
};

interface InlineBannerProps {
  variant: BannerVariant;
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

const InlineBanner = ({ variant, icon, children, action, className }: InlineBannerProps) => (
  <div
    role="alert"
    className={cn(
      'text-body-md flex items-center gap-3 rounded-xl border px-3 py-2.5',
      VARIANT_CLASSES[variant],
      className,
    )}
  >
    <span className="shrink-0">{icon}</span>
    <span className="min-w-0 flex-1">{children}</span>
    {action && <span className="shrink-0">{action}</span>}
  </div>
);

export default InlineBanner;
