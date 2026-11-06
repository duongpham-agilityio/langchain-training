import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { ResizeEdge } from '@/types/resize-edge.ts';

interface ResizeHandleProps extends HTMLAttributes<HTMLDivElement> {
  edge: ResizeEdge;
  isDragging: boolean;
}

// Each edge straddles the panel's border with an 8px invisible hit area; the
// visible 2px line is the ::after. Full class strings so Tailwind can see them.
const EDGE_CLASSES: Record<ResizeEdge, string> = {
  [ResizeEdge.Left]:
    'inset-y-0 -left-1 w-2 cursor-col-resize after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2',
  [ResizeEdge.Right]:
    'inset-y-0 -right-1 w-2 cursor-col-resize after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2',
  [ResizeEdge.Top]:
    'inset-x-0 -top-1 h-2 cursor-row-resize after:inset-x-0 after:top-1/2 after:h-0.5 after:-translate-y-1/2',
  [ResizeEdge.Bottom]:
    'inset-x-0 -bottom-1 h-2 cursor-row-resize after:inset-x-0 after:top-1/2 after:h-0.5 after:-translate-y-1/2',
};

// Drag handle for useResizablePanel. Absolutely positioned: the panel it
// resizes must be `relative`.
const ResizeHandle = ({ edge, isDragging, className, ...rest }: ResizeHandleProps) => (
  <div
    className={cn(
      'absolute z-10 touch-none outline-none',
      'after:absolute after:transition-colors',
      'hover:after:bg-primary focus-visible:after:bg-primary',
      EDGE_CLASSES[edge],
      isDragging && 'after:bg-primary',
      className,
    )}
    {...rest}
  />
);

export default ResizeHandle;
