import { useInterrupt } from '@copilotkit/react-core/v2';
import EmailSendConfirmCard from '@/components/chat/EmailSendConfirmCard.tsx';
import {
  EmailSendToolInputSchema,
  RELEASE_COPILOT_AGENT_ID,
  TOOL_NAMES,
} from '@training/contracts';

// The server pauses the run (humanInTheLoopMiddleware -> AG-UI interrupt) before emailing. Send
// resumes it with { decision: 'approve', recipient }: the address goes straight to the tool and never
// to the model. Reject cancels, and the server sends nothing.
// SINGLE CALL SITE, see DashboardPage.tsx: a second registration would render two cards.
export const useEmailSendApproval = (): void => {
  useInterrupt({
    agentId: RELEASE_COPILOT_AGENT_ID,
    enabled: (event) =>
      (event.value as { metadata?: { toolName?: string } } | undefined)
        ?.metadata?.toolName === TOOL_NAMES.sendReleaseEmail,
    render: ({ interrupt, resolve, cancel }) => {
      const args = EmailSendToolInputSchema.safeParse(
        (interrupt?.metadata as { args?: unknown } | undefined)?.args,
      );
      return (
        <EmailSendConfirmCard
          label={args.success ? args.data.release.version : undefined}
          content={args.success ? args.data.release.openingLine : undefined}
          onApprove={(recipient) => resolve({ decision: 'approve', recipient })}
          onReject={() => cancel()}
        />
      );
    },
  });
};
