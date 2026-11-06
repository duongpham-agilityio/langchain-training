import { useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import ResizeHandle from '@/components/common/ResizeHandle.tsx';
import { useResizablePanel } from '@/hooks/use-resizable-panel.ts';
import { ResizeEdge } from '@/types/resize-edge.ts';

interface DashboardLayoutProps {
  chat: ReactNode;
  preview?: ReactNode;
}

// A closed preview is NOT rendered (no zero-width element), so the chat
// reflows to the full width instead of sitting next to an empty column. The
// open panel is a flush column with its own header bars — it owns its
// padding, so nothing is added around it here. Its width comes from
// useResizablePanel (drag/keyboard handle on its left edge) and lives in this
// layout, so it survives closing and reopening the preview. Below `sm` it
// stacks under the chat instead of beside it, at natural height with no handle.
const DashboardLayout = ({ chat, preview }: DashboardLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { size, isDragging, handleProps } = useResizablePanel(containerRef, {
    edge: ResizeEdge.Left,
    defaultSize: 480,
    minSize: 480,
    maxRatio: 0.6,
    minSiblingSize: 360,
    label: 'Resize live preview',
  });

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 flex-1 flex-col sm:flex-row"
    >
      <div className="min-h-0 min-w-0 flex-1">{chat}</div>
      {preview && (
        <div
          className="border-outline-subtle relative flex min-h-0 shrink-0 flex-col border-t sm:w-(--preview-width) sm:border-t-0 sm:border-l"
          style={{ '--preview-width': `${size}px` } as CSSProperties}
        >
          <ResizeHandle
            edge={ResizeEdge.Left}
            isDragging={isDragging}
            className="max-sm:hidden"
            {...handleProps}
          />
          {preview}
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
