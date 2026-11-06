import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const enum BadgeVariant {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
  Neutral = 'neutral',
  Brand = 'brand',
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  [BadgeVariant.Success]: 'bg-success-emerald/10 text-success-emerald',
  [BadgeVariant.Error]: 'bg-error-rose/10 text-error-rose',
  [BadgeVariant.Warning]: 'bg-warning-purple/10 text-warning-purple',
  [BadgeVariant.Neutral]: 'bg-surface-container text-on-surface-variant',
  [BadgeVariant.Brand]: 'bg-primary-soft text-on-primary-soft',
};

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

// The design's `.badge`: a 20px pill with 11.5px semibold text.
const Badge = ({ variant, children }: BadgeProps) => (
  <span
    className={cn(
      'text-label-xs inline-flex h-5 items-center gap-1.25 rounded-full px-2 font-semibold whitespace-nowrap',
      VARIANT_CLASSES[variant],
    )}
  >
    {children}
  </span>
);

export default Badge;
