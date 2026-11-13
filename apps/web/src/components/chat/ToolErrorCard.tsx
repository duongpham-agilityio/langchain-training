import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useCopilotKit } from '@copilotkit/react-core/v2';
import { RELEASE_COPILOT_AGENT_ID } from '@training/contracts';
import { createUUID } from '@/lib/uuid.ts';

interface ToolErrorCardProps {
  toolName: string;
  detail: string;
}

const RETRY_PROMPT = 'The last result could not be shown. Please try again.';

const ToolErrorCard = ({ toolName, detail }: ToolErrorCardProps) => {
  const { copilotkit } = useCopilotKit();

  // Re-asks the agent; a failed run then shows the normal send-failure notice.
  const handleRetry = () => {
    const agent = copilotkit.getAgent(RELEASE_COPILOT_AGENT_ID);
    if (!agent || agent.isRunning) return;

    agent.addMessage({ id: createUUID(), role: 'user', content: RETRY_PROMPT });
    void copilotkit.runAgent({ agent }).catch((error: unknown) => {
      console.error('[chat] tool retry failed', error);
    });
  };

  return (
    <div
      role="alert"
      className="border-error/30 bg-error/5 flex flex-col gap-1 rounded-xl border px-3 py-2"
    >
      <span className="text-label-sm text-error flex items-center gap-2">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        Release Builder sent unusable data for <code className="font-mono">{toolName}</code>
      </span>
      <span className="text-body-md text-on-surface-variant break-words">
        Nothing was updated on screen. Try again — it usually succeeds on a second attempt.
      </span>
      <button
        type="button"
        onClick={handleRetry}
        className="text-primary text-label-sm flex w-fit cursor-pointer items-center gap-1 font-semibold hover:underline"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Try again
      </button>
      <span className="text-label-sm text-on-surface-variant/70 break-words">{detail}</span>
    </div>
  );
};

export default ToolErrorCard;
