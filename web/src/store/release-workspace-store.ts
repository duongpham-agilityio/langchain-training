import { create } from 'zustand';
import { createDraftSlice, type DraftSlice } from '@/store/draft-slice.ts';

export type ReleaseWorkspaceStore = DraftSlice;

// Not persisted: the draft is driven by the tool-call render in
// use-release-draft.tsx, which replays from Mastra's own persisted history on
// reconnect — a second, client-side persisted copy of the same data is a source
// of drift, not safety.
export const useReleaseWorkspaceStore = create<ReleaseWorkspaceStore>()(
  (...args) => ({
    ...createDraftSlice(...args),
  }),
);
