import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  align?: 'start' | 'end';
  className?: string;
  children: ReactNode;
}

const DropdownMenuRoot = ({
  isOpen,
  onClose,
  align = 'start',
  className,
  children,
}: DropdownMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      className={cn(
        'bg-surface-container-lowest absolute z-30 w-56 rounded-xl p-1.5 shadow-2xl',
        align === 'end' ? 'right-0' : 'left-0',
        className,
      )}
    >
      {children}
    </div>
  );
};

interface DropdownMenuItemProps {
  icon?: ReactNode;
  hint?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

const DropdownMenuItem = ({
  icon,
  hint,
  danger = false,
  disabled = false,
  onClick,
  children,
}: DropdownMenuItemProps) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'text-body-md flex h-[34px] w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left font-medium transition-colors disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent',
      danger
        ? 'text-error-rose hover:bg-error-rose/10'
        : 'text-on-surface hover:bg-surface-container',
    )}
  >
    {icon && (
      <span className={cn('shrink-0', danger ? 'text-error-rose' : 'text-on-surface-variant')}>
        {icon}
      </span>
    )}
    <span className="flex-1 truncate">{children}</span>
    {hint && <span className="text-label-sm text-on-surface-variant/70 shrink-0">{hint}</span>}
  </button>
);

const DropdownMenuSeparator = () => <div className="bg-outline-variant my-1.5 h-px" />;

const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Item: DropdownMenuItem,
  Separator: DropdownMenuSeparator,
});

export default DropdownMenu;
