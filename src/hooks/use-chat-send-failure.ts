import { useCallback, useEffect } from 'react';
import {
  useCopilotKit,
  isAbortError,
  CopilotKitCoreErrorCode,
  type AbstractAgent,
} from '@copilotkit/react-core/v2';
import { RELEASE_COPILOT_AGENT_ID } from '@/constants/agent-tools/agent-id.ts';
import {
  useChatSendFailureStore,
  type ChatSendFailure,
} from '@/store/chat-send-failure-store.ts';

// The codes that mean "the run started by sending a message failed". Everything
// else CopilotKit emits is not a failed send: RUNTIME_INFO_FETCH_FAILED belongs
// to ConnectionErrorDialog, TOOL_* only fire for frontend tools with a handler
// (this app has none, and the error goes back to the agent anyway),
// AGENT_CONNECT_FAILED is loading a stored thread, TRANSCRIPTION_* is voice.
const SEND_FAILED_CODES: ReadonlySet<CopilotKitCoreErrorCode> = new Set([
  CopilotKitCoreErrorCode.AGENT_RUN_FAILED,
  CopilotKitCoreErrorCode.AGENT_RUN_FAILED_EVENT,
  CopilotKitCoreErrorCode.AGENT_RUN_ERROR_EVENT,
  CopilotKitCoreErrorCode.AGENT_THREAD_LOCKED,
]);

const toFailureTitle = (code: CopilotKitCoreErrorCode): string =>
  code === CopilotKitCoreErrorCode.AGENT_THREAD_LOCKED
    ? 'Release Builder is still answering a previous message.'
    : 'Message failed to send.';

const findLastUserMessageId = (agent: AbstractAgent): string | undefined =>
  agent.messages.findLast((message) => message.role === 'user')?.id;

// Mount once, in CopilotAssistantPanel. A new run (a new message, or a retry)
// clears the previous failure; switching threads needs no reset because the
// notice only renders under the message id it failed on.
export const useChatSendFailureListener = (): void => {
  const { copilotkit } = useCopilotKit();
  const setFailure = useChatSendFailureStore((state) => state.setFailure);
  const clearFailure = useChatSendFailureStore((state) => state.clearFailure);

  useEffect(() => {
    const subscription = copilotkit.subscribe({
      onAgentRunStarted: ({ agent }) => {
        if (agent.agentId === RELEASE_COPILOT_AGENT_ID) clearFailure();
      },
      onError: ({ error, code, context }) => {
        if (context.agentId !== RELEASE_COPILOT_AGENT_ID) return;
        if (!SEND_FAILED_CODES.has(code) || isAbortError(error)) return;

        const agent = copilotkit.getAgent(RELEASE_COPILOT_AGENT_ID);
        const messageId = agent && findLastUserMessageId(agent);
        if (!messageId) return;

        console.error(`[chat] ${code}`, error, context);
        setFailure({
          messageId,
          title: toFailureTitle(code),
          detail: error.message,
        });
      },
    });

    return () => subscription.unsubscribe();
  }, [copilotkit, setFailure, clearFailure]);
};

interface UseChatSendFailureResult {
  failure: ChatSendFailure | null;
  retry: () => void;
}

export const useChatSendFailure = (
  messageId: string,
): UseChatSendFailureResult => {
  const { copilotkit } = useCopilotKit();
  const failure = useChatSendFailureStore((state) =>
    state.failure?.messageId === messageId ? state.failure : null,
  );

  // Drops whatever a broken stream left after the failed message, so the retry
  // re-sends that message instead of continuing from a half-written reply.
  const retry = useCallback(() => {
    const agent = copilotkit.getAgent(RELEASE_COPILOT_AGENT_ID);
    if (!agent) return;

    const index = agent.messages.findIndex(
      (message) => message.id === messageId,
    );
    if (index === -1) return;

    agent.setMessages(agent.messages.slice(0, index + 1));
    // Run failures come back through onError; this only catches a rejection
    // from detaching a still-active run.
    void copilotkit.runAgent({ agent }).catch((error: unknown) => {
      console.error('[chat] retry failed', error);
    });
  }, [copilotkit, messageId]);

  return { failure, retry };
};
