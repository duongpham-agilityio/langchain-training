import { useEffect, useRef } from 'react';
import { z } from 'zod';
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
import { RELEASE_COPILOT_AGENT_ID } from '@training/contracts';
import { TOOL_NAMES } from '@training/contracts';
import ToolRefusalCard from '@/components/chat/ToolRefusalCard.tsx';
import type { ReleaseNotesDraft } from '@/types/release-notes-draft.ts';
import { parseReleasePreviewResult } from '@/types/release-preview-result.ts';

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
    TOOL_NAMES.renderReleaseNotesPreview,
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
      subtitle={
        draft.subject ? `${draft.label} · ${draft.subject}` : draft.label
      }
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
    name: TOOL_NAMES.renderReleaseNotesPreview,
    // The call's arguments (release input) are not shown; the card is built
    // from the tool's result.
    parameters: z.object({}).loose(),
    agentId: RELEASE_COPILOT_AGENT_ID,
    render: (props) => {
      // The preview must never stream: show nothing until the tool call has
      // its final result, so the card and Live Preview appear complete.
      if (props.status !== 'complete') {
        return <></>;
      }

      const outcome = parseReleasePreviewResult(props.result);

      if (outcome.kind === 'pending') {
        return <></>;
      }

      if (outcome.kind === 'failed') {
        return (
          <ToolRefusalCard
            message={`Release notes could not be built. ${outcome.message}`}
          />
        );
      }

      if (outcome.kind === 'invalid') {
        console.warn(
          '[useReleaseDraft] received invalid result',
          outcome.detail,
        );
        return (
          <ToolErrorCard
            toolName={TOOL_NAMES.renderReleaseNotesPreview}
            detail={outcome.detail}
          />
        );
      }

      if (outcome.kind === 'refused') {
        return <ToolRefusalCard message={outcome.message} />;
      }

      return (
        <DraftToolCall
          toolCallId={props.toolCallId}
          draft={outcome.draft}
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
