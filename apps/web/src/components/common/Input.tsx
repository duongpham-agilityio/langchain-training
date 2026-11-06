import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  rightSlot?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

const Input = ({ icon, rightSlot, className, ref, ...rest }: InputProps) => (
  <div className="relative">
    {icon && (
      <span className="text-on-surface-variant absolute top-1/2 left-3 -translate-y-1/2">
        {icon}
      </span>
    )}
    <input
      ref={ref}
      className={cn(
        'border-outline-variant bg-surface-container-lowest w-full rounded-xl border',
        'text-body-md text-on-surface placeholder:text-on-surface-variant',
        'focus:ring-primary px-4 py-2 focus:ring-2 focus:outline-none',
        icon ? 'pl-10' : undefined,
        rightSlot ? 'pr-10' : undefined,
        className,
      )}
      {...rest}
    />
    {rightSlot && (
      <span className="absolute top-1/2 right-1 -translate-y-1/2">{rightSlot}</span>
    )}
  </div>
);

export default Input;
