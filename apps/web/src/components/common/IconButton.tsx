import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const enum IconButtonSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  [IconButtonSize.Sm]: 'size-7 rounded-[7px]',
  [IconButtonSize.Md]: 'size-8 rounded-lg',
  [IconButtonSize.Lg]: 'size-9 rounded-lg',
};

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  'aria-label': string;
  size?: IconButtonSize;
  isActive?: boolean;
  isOutlined?: boolean;
}

// The design's `.btn-icon`: a neutral, muted-grey control that darkens on
// hover, never a tinted/primary one. `isOutlined` is `.btn-icon.outlined` —
// a bordered white square that sits next to `.btn-secondary` buttons.
const IconButton = ({
  icon,
  size = IconButtonSize.Md,
  isActive = false,
  isOutlined = false,
  className,
  ...rest
}: IconButtonProps) => (
  <button
    type="button"
    className={cn(
      'hover:bg-surface-container hover:text-on-surface inline-flex shrink-0 cursor-pointer items-center justify-center bg-transparent transition-colors disabled:pointer-events-none disabled:cursor-default disabled:bg-transparent disabled:opacity-35',
      SIZE_CLASSES[size],
      isActive ? 'bg-surface-container text-on-surface' : 'text-on-surface-muted',
      isOutlined &&
        'border-outline-strong bg-surface-container-lowest hover:bg-surface-container-low border shadow-sm',
      isOutlined && isActive && 'bg-surface-container-low',
      className,
    )}
    {...rest}
  >
    {icon}
  </button>
);

export default IconButton;
