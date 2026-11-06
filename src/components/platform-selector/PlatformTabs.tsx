import Tabs, { TabsVariant, type TabItem } from '@/components/common/Tabs.tsx';
import { cn } from '@/lib/cn.ts';

interface PlatformTabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

const PlatformTabs = ({
  items,
  value,
  onChange,
  disabled = false,
  className,
  containerClassName,
}: PlatformTabsProps) => (
  <Tabs
    items={items}
    value={value}
    onChange={onChange}
    variant={TabsVariant.Pill}
    disabled={disabled}
    className={cn('text-label-sm', className)}
    containerClassName={containerClassName}
  />
);

export default PlatformTabs;
