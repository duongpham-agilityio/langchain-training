import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center gap-2 px-6 py-14 text-center',
      className,
    )}
  >
    <span className="bg-surface-container text-on-surface-variant mb-1 flex size-11 shrink-0 items-center justify-center rounded-xl">
      {icon}
    </span>
    <span className="text-body-lg text-on-surface font-semibold">{title}</span>
    {description && (
      <span className="text-body-md text-on-surface-variant max-w-[280px] leading-relaxed">
        {description}
      </span>
    )}
    {action && <span className="mt-2">{action}</span>}
  </div>
);

export default EmptyState;
