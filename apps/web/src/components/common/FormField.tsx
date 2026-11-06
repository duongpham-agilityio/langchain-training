import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

const FormField = ({ id, label, error, children, className }: FormFieldProps) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    <label htmlFor={id} className="text-label-sm text-on-surface font-semibold">
      {label}
    </label>
    {children}
    {error && (
      <span role="alert" className="text-label-sm text-error">
        {error}
      </span>
    )}
  </div>
);

export default FormField;
