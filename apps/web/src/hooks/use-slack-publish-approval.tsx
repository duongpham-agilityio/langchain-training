import { useInterrupt } from '@copilotkit/react-core/v2';
import SlackPublishConfirmCard from '@/components/chat/SlackPublishConfirmCard.tsx';
import { RELEASE_COPILOT_AGENT_ID } from '@/constants/agent-tools/agent-id.ts';
import { PUBLISH_RELEASE_NOTES_TO_SLACK_TOOL_NAME } from '@/constants/agent-tools/tools-name.ts';
import { SlackPublishRequestSchema } from '@/types/slack-publish-request.ts';

// The server pauses the run (LangChain humanInTheLoopMiddleware -> AG-UI
// interrupt) before publishing to Slack. Approve resumes it with
// { decision: 'approve' }; Reject cancels, and the server posts nothing.
// SINGLE CALL SITE, see DashboardPage.tsx: a second registration would render
// two cards.
export const useSlackPublishApproval = (): void => {
  useInterrupt({
    agentId: RELEASE_COPILOT_AGENT_ID,
    enabled: (event) =>
      (event.value as { metadata?: { toolName?: string } } | undefined)?.metadata
        ?.toolName === PUBLISH_RELEASE_NOTES_TO_SLACK_TOOL_NAME,
    render: ({ interrupt, resolve, cancel }) => {
      const args = SlackPublishRequestSchema.safeParse(
        (interrupt?.metadata as { args?: unknown } | undefined)?.args,
      );
      return (
        <SlackPublishConfirmCard
          label={args.success ? args.data.label : undefined}
          content={args.success ? args.data.content : undefined}
          onApprove={() => resolve({ decision: 'approve' })}
          onReject={() => cancel()}
        />
      );
    },
  });
};
