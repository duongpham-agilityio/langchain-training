import { useEffect, useRef, useState } from 'react';
import type {
  HTMLAttributes,
  KeyboardEvent,
  PointerEvent,
  RefObject,
} from 'react';
import { ResizeEdge } from '@/types/resize-edge.ts';

interface EdgeConfig {
  isHorizontal: boolean;
  // Sign applied to the pointer delta: +1 when dragging toward increasing
  // coordinates grows the panel (handle on its right/bottom edge), -1 otherwise.
  sign: 1 | -1;
  growKey: string;
  shrinkKey: string;
}

const EDGE_CONFIG: Record<ResizeEdge, EdgeConfig> = {
  [ResizeEdge.Left]: { isHorizontal: true, sign: -1, growKey: 'ArrowLeft', shrinkKey: 'ArrowRight' },
  [ResizeEdge.Right]: { isHorizontal: true, sign: 1, growKey: 'ArrowRight', shrinkKey: 'ArrowLeft' },
  [ResizeEdge.Top]: { isHorizontal: false, sign: -1, growKey: 'ArrowUp', shrinkKey: 'ArrowDown' },
  [ResizeEdge.Bottom]: { isHorizontal: false, sign: 1, growKey: 'ArrowDown', shrinkKey: 'ArrowUp' },
};

export interface UseResizablePanelOptions {
  edge: ResizeEdge;
  defaultSize: number;
  minSize: number;
  // Largest share of the container the panel may take. Default: 1 (no cap).
  maxRatio?: number;
  // Space the rest of the container always keeps. Default: 0.
  minSiblingSize?: number;
  keyboardStep?: number;
  // Accessible name of the handle.
  label?: string;
}

export interface UseResizablePanelResult {
  // Current panel size in px, along the axis implied by `edge` (width for
  // Left/Right, height for Top/Bottom).
  size: number;
  isDragging: boolean;
  handleProps: HTMLAttributes<HTMLDivElement>;
}

// Drag/keyboard resizing for one panel inside `containerRef`. The panel is
// sized by the caller from `size` (e.g. a CSS variable); the handle spread from
// `handleProps` goes on `ResizeHandle` placed on the panel's `edge`.
//
// The raw size is kept as the user set it and clamped only when read, so a
// small container squeezes the panel without forgetting the chosen size — it
// springs back when the container grows again. Not persisted: a reload starts
// from `defaultSize`.
export const useResizablePanel = (
  containerRef: RefObject<HTMLElement | null>,
  {
    edge,
    defaultSize,
    minSize,
    maxRatio = 1,
    minSiblingSize = 0,
    keyboardStep = 16,
    label = 'Resize panel',
  }: UseResizablePanelOptions,
): UseResizablePanelResult => {
  const { isHorizontal, sign, growKey, shrinkKey } = EDGE_CONFIG[edge];
  const [rawSize, setRawSize] = useState(defaultSize);
  const [containerSize, setContainerSize] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startPointer: number; startSize: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize(isHorizontal ? width : height);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, isHorizontal]);

  useEffect(() => {
    if (!isDragging) return;

    const { body } = document;
    const previous = { cursor: body.style.cursor, userSelect: body.style.userSelect };
    body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    body.style.userSelect = 'none';
    return () => {
      body.style.cursor = previous.cursor;
      body.style.userSelect = previous.userSelect;
    };
  }, [isDragging, isHorizontal]);

  // Before the first measurement there is nothing to clamp against.
  const maxSize = containerSize
    ? Math.max(
        minSize,
        Math.min(containerSize * maxRatio, containerSize - minSiblingSize),
      )
    : Infinity;
  const clamp = (value: number) => Math.min(maxSize, Math.max(minSize, value));
  const size = clamp(rawSize);

  const readPointer = (event: PointerEvent<HTMLDivElement>) =>
    isHorizontal ? event.clientX : event.clientY;

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startPointer: readPointer(event), startSize: size };
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    setRawSize(clamp(drag.startSize + sign * (readPointer(event) - drag.startPointer)));
  };

  const endDrag = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = {
      [growKey]: size + keyboardStep,
      [shrinkKey]: size - keyboardStep,
      Home: minSize,
      End: maxSize,
    }[event.key];
    if (next === undefined) return;

    event.preventDefault();
    setRawSize(clamp(next));
  };

  return {
    size,
    isDragging,
    handleProps: {
      role: 'separator',
      tabIndex: 0,
      // A separator's orientation is that of the line, not of the resize axis.
      'aria-orientation': isHorizontal ? 'vertical' : 'horizontal',
      'aria-label': label,
      'aria-valuenow': Math.round(size),
      'aria-valuemin': minSize,
      'aria-valuemax': Number.isFinite(maxSize) ? Math.round(maxSize) : undefined,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onKeyDown: handleKeyDown,
      onDoubleClick: () => setRawSize(defaultSize),
    },
  };
};
