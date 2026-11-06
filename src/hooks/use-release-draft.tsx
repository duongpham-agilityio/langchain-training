import { useEffect, useRef } from 'react';
import { useRenderTool } from '@copilotkit/react-core/v2';
import { useReleaseWorkspaceStore } from '@/store/release-workspace-store.ts';
import type { SelectedDraft } from '@/store/draft-slice.ts';
import {
  useReleaseDraftView,
  type ReleaseDraftView,
} from '@/hooks/use-release-draft-view.ts';
import { useThreadSession } from '@/hooks/use-thread-session.ts';
import { useIsLatestToolCall } from '@/hooks/use-is-latest-tool-call.ts';
import ToolErrorCard from '@/components/chat/ToolErrorCard.tsx';
import ReleaseDraftCard from '@/components/release-notes/ReleaseDraftCard.tsx';
import { RELEASE_COPILOT_AGENT_ID } from '@/constants/agent-tools/agent-id.ts';
import { RENDER_RELEASE_NOTES_PREVIEW_TOOL_NAME } from '@/constants/agent-tools/tools-name.ts';
import {
  ReleaseNotesDraftSchema,
  type ReleaseNotesDraft,
} from '@/types/release-notes-draft.ts';

interface DraftToolCallProps {
  toolCallId: string;
  draft: ReleaseNotesDraft;
  isPreviewOpen: boolean;
  onSync: (draft: ReleaseNotesDraft) => void;
  onOpen: (selected: SelectedDraft | null) => void;
}

// Only the thread's newest renderReleaseNotesPreview call may write to the
// store — an older draft re-mounted by scrolling up must not overwrite the
// latest one in the Live Preview (see useIsLatestToolCall). Any card can still
// be OPENED: an older one becomes the store's `selected` draft, the newest one
// clears it. The card reads "Viewing" when it is the draft the panel shows.
const DraftToolCall = ({
  toolCallId,
  draft,
  isPreviewOpen,
  onSync,
  onOpen,
}: DraftToolCallProps) => {
  const isLatest = useIsLatestToolCall(
    RENDER_RELEASE_NOTES_PREVIEW_TOOL_NAME,
    toolCallId,
  );
  const { selectedToolCallId } = useReleaseDraftView();

  useEffect(() => {
    if (isLatest) {
      onSync(draft);
    }
  }, [isLatest, draft, onSync]);

  const isShown = selectedToolCallId
    ? selectedToolCallId === toolCallId
    : isLatest;

  return (
    <ReleaseDraftCard
      title={
        draft.version ? `Release notes · v${draft.version}` : 'Release notes'
      }
      subtitle={draft.label}
      isGenerating={false}
      isViewing={isShown && isPreviewOpen}
      onOpen={() => onOpen(isLatest ? null : { toolCallId, draft })}
    />
  );
};

// Owns the "Build release notes dynamic platform" domain end to end: registers
// the renderReleaseNotesPreview render tool — SINGLE CALL SITE, see Task 9 —
// and returns the full draft view via useReleaseDraftView underneath. Any
// OTHER hook or component that only needs to read the draft/platform content
// must call useReleaseDraftView() instead of this one.
interface UseReleaseDraftOptions {
  isPreviewOpen: boolean;
  onOpenPreview: () => void;
}

export const useReleaseDraft = ({
  isPreviewOpen,
  onOpenPreview,
}: UseReleaseDraftOptions): ReleaseDraftView => {
  const { threadId } = useThreadSession();
  const threadIdRef = useRef(threadId);
  useEffect(() => {
    threadIdRef.current = threadId;
  }, [threadId]);

  const view = useReleaseDraftView();
  const setDraft = useReleaseWorkspaceStore((state) => state.setDraft);
  const selectDraft = useReleaseWorkspaceStore((state) => state.selectDraft);

  useRenderTool({
    name: RENDER_RELEASE_NOTES_PREVIEW_TOOL_NAME,
    parameters: ReleaseNotesDraftSchema,
    agentId: RELEASE_COPILOT_AGENT_ID,
    render: (props) => {
      if (props.status === 'inProgress') {
        return (
          <ReleaseDraftCard
            title="Release notes"
            isGenerating
            onOpen={onOpenPreview}
          />
        );
      }

      const result = ReleaseNotesDraftSchema.safeParse(props.parameters);

      if (!result.success) {
        console.warn(
          '[useReleaseDraft] received invalid parameters',
          result.error,
        );
        return (
          <ToolErrorCard
            toolName={RENDER_RELEASE_NOTES_PREVIEW_TOOL_NAME}
            detail={result.error.message}
          />
        );
      }

      return (
        <DraftToolCall
          toolCallId={props.toolCallId}
          draft={result.data}
          isPreviewOpen={isPreviewOpen}
          onSync={(draft) => setDraft(threadIdRef.current, draft)}
          onOpen={(selected) => {
            selectDraft(threadIdRef.current, selected);
            onOpenPreview();
          }}
        />
      );
    },
  });

  return view;
};
