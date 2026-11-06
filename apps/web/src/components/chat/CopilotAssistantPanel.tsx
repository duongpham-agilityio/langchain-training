import { useEffect } from 'react';
import { CopilotChat, useAgent } from '@copilotkit/react-core/v2';
import { RELEASE_COPILOT_AGENT_ID } from '@/constants/agent-tools/agent-id';
import { useChatSendFailureListener } from '@/hooks/use-chat-send-failure.ts';
import { useDraftThreadRow } from '@/hooks/use-draft-thread-row.ts';
import CopilotUserMessage from './CopilotUserMessage.tsx';
import WelcomeScreen from './WelcomeScreen.tsx';
import { useAgentContext } from '@/hooks/use-agent-context.ts';

const CopilotAssistantPanel = () => {
  const { agent } = useAgent({ agentId: RELEASE_COPILOT_AGENT_ID });

  useAgentContext();

  useEffect(() => {
    return () => {
      agent.setMessages([]);
    };
  }, [agent]);

  useDraftThreadRow({
    agent,
    hasMessages: agent.messages.length > 0,
  });

  useChatSendFailureListener();

  return (
    <div className="bg-surface-container-lowest flex h-full w-full flex-col">
      <CopilotChat
        agentId={RELEASE_COPILOT_AGENT_ID}
        className="min-h-0 flex-1"
        welcomeScreen={WelcomeScreen}
        labels={{
          chatInputPlaceholder: 'Ask Copilot about your release notes...',
          chatDisclaimerText: '',
        }}
        messageView={{
          userMessage: CopilotUserMessage,
          className: 'mx-auto flex h-full w-full flex-col gap-6 px-8 pt-7 pb-3',
        }}
      />
    </div>
  );
};

export default CopilotAssistantPanel;
