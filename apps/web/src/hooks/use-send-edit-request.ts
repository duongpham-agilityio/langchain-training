import { useCopilotKit } from '@copilotkit/react-core/v2';
import { RELEASE_COPILOT_AGENT_ID } from '@training/contracts';
import {
  buildEditRequestMessage,
  type EditRequestInput,
} from '@/lib/release-notes/build-edit-request-message.ts';
import { createUUID } from '@/lib/uuid.ts';

// Sends an edit request as one ordinary user chat message and runs the agent, the same way the
// tool retry card does. Returns false when the agent is missing or already busy.
export const useSendEditRequest = () => {
  const { copilotkit } = useCopilotKit();

  return (input: EditRequestInput): boolean => {
    const agent = copilotkit.getAgent(RELEASE_COPILOT_AGENT_ID);
    if (!agent || agent.isRunning) return false;

    agent.addMessage({
      id: createUUID(),
      role: 'user',
      content: buildEditRequestMessage(input),
    });
    void copilotkit.runAgent({ agent }).catch((error: unknown) => {
      console.error('[chat] edit request failed', error);
    });
    return true;
  };
};
