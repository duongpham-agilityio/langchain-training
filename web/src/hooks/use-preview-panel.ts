import { useEffect, useRef, useState } from 'react';
import { useReleaseDraftView } from '@/hooks/use-release-draft-view.ts';
import type { ReleaseNotesDraft } from '@/types/release-notes-draft.ts';

export interface UsePreviewPanelResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

// Opens the Live Preview whenever a NEW draft arrives, and keeps it closed after
// the user dismisses it until the next one. Identity is the store object's
// reference: draft-slice.ts no-ops a setDraft whose serialized value is
// unchanged, so a re-rendered tool call for the same draft does not produce a new
// reference and cannot re-open a panel the user just closed. Switching threads
// swaps in that thread's own draft — non-null opens, null closes.
//
// Reads the draft through useReleaseDraftView(), the read-only projection. It
// must NEVER call useReleaseDraft(), which registers the render tool; a second
// registration would double-handle every tool call.
export const usePreviewPanel = (): UsePreviewPanelResult => {
  const { draft } = useReleaseDraftView();
  const [isOpen, setIsOpen] = useState(false);
  const lastDraftRef = useRef<ReleaseNotesDraft | null>(null);

  useEffect(() => {
    if (draft === lastDraftRef.current) return;
    lastDraftRef.current = draft;
    setIsOpen(draft !== null);
  }, [draft]);

  // `open` exists because a closed panel would otherwise stay closed until the
  // agent produced a NEW draft — there is no way back to a draft the user is
  // still working on. The caller decides when offering it makes sense (only
  // when a draft exists).
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
};
