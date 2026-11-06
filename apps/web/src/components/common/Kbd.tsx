import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface KbdProps {
  children: ReactNode;
  className?: string;
}

// The design's `.kbd` keycap — a white chip with a thicker bottom border so it
// reads as a physical key (sidebar's ⌘K, the composer's ⏎ hint).
const Kbd = ({ children, className }: KbdProps) => (
  <kbd
    className={cn(
      'border-outline-strong text-on-surface-muted bg-surface-container-lowest rounded-[5px] border border-b-2 px-[5px] font-mono text-[10.5px] leading-4',
      className,
    )}
  >
    {children}
  </kbd>
);

export default Kbd;
