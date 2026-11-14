import { useInterrupt } from '@copilotkit/react-core/v2';
import EditApprovalCard from '@/components/chat/EditApprovalCard.tsx';
import { findItemDescription } from '@/lib/release-notes/find-item-description.ts';
import {
  EditReleaseItemToolInputSchema,
  RELEASE_COPILOT_AGENT_ID,
  TOOL_NAMES,
} from '@training/contracts';

// The server pauses the run (humanInTheLoopMiddleware -> AG-UI interrupt) before editReleaseItem
// runs. Accept resumes it with { decision: 'approve' } and the draft changes; Reject cancels and
// nothing changes. Own `enabled` filter, so it never renders for the Slack approval.
// SINGLE CALL SITE, see DashboardPage.tsx.
export const useEditApproval = (): void => {
  useInterrupt({
    agentId: RELEASE_COPILOT_AGENT_ID,
    enabled: (event) =>
      (event.value as { metadata?: { toolName?: string } } | undefined)?.metadata
        ?.toolName === TOOL_NAMES.editReleaseItem,
    render: ({ interrupt, resolve, cancel }) => {
      const args = EditReleaseItemToolInputSchema.safeParse(
        (interrupt?.metadata as { args?: unknown } | undefined)?.args,
      );
      return (
        <EditApprovalCard
          before={
            args.success
              ? findItemDescription(args.data.release, args.data.itemId)
              : undefined
          }
          after={args.success ? args.data.description : undefined}
          onAccept={() => resolve({ decision: 'approve' })}
          onReject={() => cancel()}
        />
      );
    },
  });
};
