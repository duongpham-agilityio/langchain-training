import { useAgent } from '@copilotkit/react-core/v2';
import { RELEASE_COPILOT_AGENT_ID } from '@/constants/agent-tools/agent-id.ts';
import { findLatestToolCallId } from '@/lib/copilot/find-latest-tool-call-id.ts';

// CopilotChat virtualizes its message list, so scrolling back up re-mounts an
// OLD tool call's render. Tool renders that sync their args into the store
// must gate on this, otherwise the re-mounted stale call overwrites the
// thread's latest entries/draft. Registers no CopilotKit primitive — safe to
// call from any number of components.
export const useIsLatestToolCall = (
  toolName: string,
  toolCallId: string,
): boolean => {
  const { agent } = useAgent({ agentId: RELEASE_COPILOT_AGENT_ID });
  return findLatestToolCallId(agent.messages, toolName) === toolCallId;
};
