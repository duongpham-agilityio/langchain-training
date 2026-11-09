import { useHumanInTheLoop } from '@copilotkit/react-core/v2';
import SlackPublishConfirmCard from '@/components/chat/SlackPublishConfirmCard.tsx';
import { RELEASE_COPILOT_AGENT_ID } from '@/constants/agent-tools/agent-id.ts';
import { CONFIRM_SLACK_PUBLISH_TOOL_NAME } from '@/constants/agent-tools/tools-name.ts';
import { SlackPublishRequestSchema } from '@/types/slack-publish-request.ts';

// The agent asks here before it publishes to Slack. The answer ('approved' or
// 'rejected') goes back to the server as the tool result; the server posts only
// on 'approved'. SINGLE CALL SITE, see DashboardPage.tsx: registering the tool
// twice would render two cards.
export const useSlackPublishConfirmation = (): void => {
  useHumanInTheLoop({
    name: CONFIRM_SLACK_PUBLISH_TOOL_NAME,
    description:
      'Ask the user to approve posting release notes to Slack before anything is sent.',
    parameters: SlackPublishRequestSchema,
    agentId: RELEASE_COPILOT_AGENT_ID,
    render: ({ status, args, respond, result }) => (
      <SlackPublishConfirmCard
        label={args.label}
        content={args.content}
        // Answered once the tool call has a result; Executing means waiting for the user.
        answer={result ? String(result) : undefined}
        canRespond={status === 'executing' && Boolean(respond)}
        onRespond={(answer) => respond?.(answer)}
      />
    ),
  });
};
