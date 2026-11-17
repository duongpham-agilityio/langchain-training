import { useCallback, useEffect, useState, type RefObject } from 'react';
import { PREVIEW_ITEM_ATTRIBUTE } from '@/constants/preview-edit.ts';

export interface PreviewSelection {
  // null when the selection is not inside exactly one mapped item (plain text, HTML email, or a
  // selection spanning items): the agent then finds the property from the selected text.
  itemId: string | null;
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

// Tracks a text selection made anywhere in the preview. Inside ONE mapped item it carries that
// item's id; otherwise itemId is null. Captured on mouse/key up and kept in state, because
// focusing the menu's input collapses the browser selection. `view` and `offset` let the HTML
// email iframe report its own selection, shifted by the iframe's position in the page.
export const usePreviewSelection = (
  rootRef: RefObject<HTMLElement | null>,
  isEnabled: boolean,
) => {
  const [selection, setSelection] = useState<PreviewSelection | null>(null);

  const capture = useCallback(
    (
      view: Window = window,
      offset: { x: number; y: number } = { x: 0, y: 0 },
    ) => {
      const root = rootRef.current;
      const current = view.getSelection();
      const isOwnView = view === window;
      if (
        !root ||
        !current ||
        current.isCollapsed ||
        current.rangeCount === 0
      ) {
        // The page's own collapsed selection is handled by selectionchange below (the menu's
        // input collapses it on purpose); clicks inside the iframe never reach that listener.
        if (!isOwnView) setSelection(null);
        return;
      }
      const text = current.toString().trim();
      if (!text) {
        setSelection(null);
        return;
      }
      const anchorId = isOwnView ? findItemId(current.anchorNode, root) : null;
      const focusId = isOwnView ? findItemId(current.focusNode, root) : null;
      const itemId =
        anchorId !== null && anchorId === focusId ? anchorId : null;
      const rect = current.getRangeAt(0).getBoundingClientRect();
      setSelection({
        itemId,
        text,
        x: rect.left + offset.x,
        y: rect.bottom + offset.y + 6,
      });
    },
    [rootRef],
  );

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
