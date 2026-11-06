import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const enum TabsVariant {
  Pill = 'pill',
  Underline = 'underline',
  Segmented = 'segmented',
}

export interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  variant?: TabsVariant;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

const CONTAINER_CLASSES: Record<TabsVariant, string> = {
  [TabsVariant.Pill]: 'inline-flex gap-1 bg-surface-container rounded-full p-1',
  [TabsVariant.Underline]: 'flex gap-6 border-b border-outline-variant',
  [TabsVariant.Segmented]: 'inline-flex gap-0.5 bg-surface-container rounded-[9px] p-0.5',
};

const TAB_CLASSES: Record<TabsVariant, { active: string; inactive: string }> = {
  [TabsVariant.Pill]: {
    active: 'bg-surface-container-lowest text-on-surface rounded-full shadow-sm px-3 py-1.5',
    inactive: 'text-on-surface-variant px-3 py-1.5',
  },
  [TabsVariant.Underline]: {
    active: 'text-primary border-b-2 border-primary pb-3',
    inactive: 'text-on-surface-variant border-b-2 border-transparent pb-3',
  },
  // The design's `.seg` control: a tinted track with a raised white thumb.
  [TabsVariant.Segmented]: {
    active:
      'bg-surface-container-lowest text-on-surface rounded-[7px] shadow-[0_1px_2px_rgba(23,21,28,0.08),0_0_0_1px_rgba(23,21,28,0.04)]',
    inactive: 'text-on-surface-muted hover:text-on-surface rounded-[7px]',
  },
};

const SEGMENTED_TAB_CLASSES =
  'inline-flex h-7 items-center gap-1.5 px-2.75 text-[12.5px] font-semibold';

const Tabs = ({
  items,
  value,
  onChange,
  variant = TabsVariant.Pill,
  disabled = false,
  className,
  containerClassName,
}: TabsProps) => (
  <div className={cn(CONTAINER_CLASSES[variant], containerClassName)}>
    {items.map((item) => (
      <button
        key={item.value}
        type="button"
        disabled={disabled}
        aria-selected={item.value === value}
        onClick={() => onChange(item.value)}
        className={cn(
          'text-body-md cursor-pointer font-medium transition-all disabled:pointer-events-none disabled:opacity-50',
          variant === TabsVariant.Segmented && SEGMENTED_TAB_CLASSES,
          item.value === value
            ? TAB_CLASSES[variant].active
            : TAB_CLASSES[variant].inactive,
          className,
        )}
      >
        {item.icon}
        {item.label}
      </button>
    ))}
  </div>
);

export default Tabs;
