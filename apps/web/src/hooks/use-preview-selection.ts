import { useCallback, useEffect, useState, type RefObject } from 'react';
import { PREVIEW_ITEM_ATTRIBUTE } from '@/constants/preview-edit.ts';

export interface PreviewSelection {
  itemId: string;
  text: string;
  // Viewport position just under the selection, where the menu opens.
  x: number;
  y: number;
}

const findItemId = (node: Node | null, root: HTMLElement): string | null => {
  const element =
    node instanceof Element ? node : (node?.parentElement ?? null);
  const item = element?.closest(`[${PREVIEW_ITEM_ATTRIBUTE}]`);
  return item && root.contains(item)
    ? item.getAttribute(PREVIEW_ITEM_ATTRIBUTE)
    : null;
};

// Tracks a text selection made inside ONE rendered preview item. A selection that starts or ends
// outside an item, or spans two items, offers no menu. The selection is captured on mouse/key up
// and kept in state, because focusing the menu's input collapses the browser selection.
export const usePreviewSelection = (
  rootRef: RefObject<HTMLElement | null>,
  isEnabled: boolean,
) => {
  const [selection, setSelection] = useState<PreviewSelection | null>(null);

  const capture = useCallback(() => {
    const root = rootRef.current;
    const current = window.getSelection();
    if (!root || !current || current.isCollapsed || current.rangeCount === 0) {
      return;
    }
    const text = current.toString().trim();
    const itemId = findItemId(current.anchorNode, root);
    const isSameItem =
      itemId !== null && itemId === findItemId(current.focusNode, root);
    if (!text || !isSameItem) {
      setSelection(null);
      return;
    }
    const rect = current.getRangeAt(0).getBoundingClientRect();
    setSelection({ itemId, text, x: rect.left, y: rect.bottom + 6 });
  }, [rootRef]);

  const dismiss = useCallback(() => setSelection(null), []);

  // A click that leaves a collapsed selection outside the menu closes it (the menu itself stops
  // propagation of mousedown, so typing in its input keeps it open).
  useEffect(() => {
    if (!selection) return;
    const onSelectionChange = () => {
      const current = window.getSelection();
      if (current?.isCollapsed && document.activeElement?.tagName !== 'INPUT') {
        setSelection(null);
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () =>
      document.removeEventListener('selectionchange', onSelectionChange);
  }, [selection]);

  // Derived, not reset in an effect: a disabled preview simply shows no menu.
  return { selection: isEnabled ? selection : null, capture, dismiss };
};
