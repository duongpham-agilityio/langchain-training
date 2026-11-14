import { useInterrupt } from '@copilotkit/react-core/v2';
import SchedulePublishConfirmCard from '@/components/chat/SchedulePublishConfirmCard.tsx';
import SlackPublishConfirmCard from '@/components/chat/SlackPublishConfirmCard.tsx';
import { RELEASE_COPILOT_AGENT_ID } from '@training/contracts';
import { TOOL_NAMES } from '@training/contracts';
import { ScheduleSendToolInputSchema } from '@training/contracts';
import { SlackPublishToolInputSchema } from '@training/contracts';

// The server pauses the run (LangChain humanInTheLoopMiddleware -> AG-UI
// interrupt) before publishing to Slack or scheduling a send. Approve resumes
// it with { decision: 'approve' }; Reject cancels, and the server does nothing.
// SINGLE CALL SITE, see DashboardPage.tsx: a second registration would render
// two cards, so both tools share this one hook and pick the card by tool name.
const toolNameOf = (event: { value?: unknown }): string | undefined =>
  (event.value as { metadata?: { toolName?: string } } | undefined)?.metadata
    ?.toolName;

export const useSlackPublishApproval = (): void => {
  useInterrupt({
    agentId: RELEASE_COPILOT_AGENT_ID,
    enabled: (event) => {
      const name = toolNameOf(event);
      return (
        name === TOOL_NAMES.publishReleaseNotesToSlack ||
        name === TOOL_NAMES.scheduleReleaseSend
      );
    },
    render: ({ event, interrupt, resolve, cancel }) => {
      const rawArgs = (interrupt?.metadata as { args?: unknown } | undefined)
        ?.args;
      if (toolNameOf(event) === TOOL_NAMES.scheduleReleaseSend) {
        const args = ScheduleSendToolInputSchema.safeParse(rawArgs);
        return (
          <SchedulePublishConfirmCard
            label={args.success ? args.data.release.version : undefined}
            localDateTime={args.success ? args.data.localDateTime : undefined}
            onApprove={() => resolve({ decision: 'approve' })}
            onReject={() => cancel()}
          />
        );
      }
      const args = SlackPublishToolInputSchema.safeParse(rawArgs);
      return (
        <SlackPublishConfirmCard
          label={args.success ? args.data.release.version : undefined}
          content={args.success ? args.data.release.openingLine : undefined}
          onApprove={() => resolve({ decision: 'approve' })}
          onReject={() => cancel()}
        />
      );
    },
  });
};
