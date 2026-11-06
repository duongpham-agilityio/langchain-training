import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const enum ButtonVariant {
  Primary = 'primary',
  Secondary = 'secondary',
  Ghost = 'ghost',
  Danger = 'danger',
}

export const enum ButtonSize {
  Md = 'md',
  Sm = 'sm',
}

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  [ButtonVariant.Primary]: 'bg-primary text-white! hover:bg-primary-hover',
  [ButtonVariant.Secondary]:
    'bg-surface-container-lowest text-on-surface border border-outline-strong shadow-sm hover:bg-surface-container-low',
  [ButtonVariant.Ghost]: 'bg-transparent text-primary hover:bg-primary/10',
  [ButtonVariant.Danger]: 'bg-error-rose text-on-error hover:bg-error-rose/90',
};

// Sm is the design's `.btn`: a 32px, 13px-semibold control with an icon gap.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  [ButtonSize.Md]: 'text-body-md rounded-xl px-4 py-2 font-medium',
  [ButtonSize.Sm]:
    'text-body-sm inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 py-0 font-semibold whitespace-nowrap',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = ({
  variant = ButtonVariant.Primary,
  size = ButtonSize.Md,
  className,
  ...rest
}: ButtonProps) => (
  <button
    type="button"
    className={cn(
      'cursor-pointer transition-colors disabled:pointer-events-none disabled:cursor-default disabled:opacity-50',
      SIZE_CLASSES[size],
      BUTTON_VARIANT_CLASSES[variant],
      className,
    )}
    {...rest}
  />
);

export default Button;
