import {
  CopilotSidebar,
  useConfigureSuggestions,
  type CopilotChatAssistantMessage,
  type CopilotChatUserMessage,
} from '@copilotkit/react-core/v2';
import { RELEASE_COPILOT_AGENT_ID } from '@/constants/agent-tools/agent-id';
import AssistantMessageBubble from './AssistantMessageBubble.tsx';
import UserMessageBubble from './UserMessageBubble.tsx';

const QUICK_ACTION_SUGGESTIONS = [
  { title: 'Make it shorter', message: 'Make it shorter' },
  { title: 'Translate to VI', message: 'Translate to VI' },
  { title: 'Add emojis', message: 'Add emojis' },
];

const ChatSidebar = () => {
  useConfigureSuggestions(
    {
      consumerAgentId: RELEASE_COPILOT_AGENT_ID,
      suggestions: QUICK_ACTION_SUGGESTIONS,
    },
    [],
  );

  return (
    <CopilotSidebar
      agentId={RELEASE_COPILOT_AGENT_ID}
      defaultOpen
      labels={{
        modalHeaderTitle: 'Release Builder',
      }}
      header={{
        titleContent: {
          children: (
            <span className="flex items-center gap-2">
              <span
                className="bg-success-emerald size-3 shrink-0 rounded-full"
                aria-hidden="true"
              />
              <span className="text-headline-md text-on-surface">Release Builder</span>
            </span>
          ),
        },
      }}
      messageView={{
        assistantMessage: AssistantMessageBubble as typeof CopilotChatAssistantMessage,
        userMessage: UserMessageBubble as typeof CopilotChatUserMessage,
      }}
      suggestionView={{
        suggestion: {
          className:
            'bg-secondary-container/20 border-secondary-container/50 text-secondary rounded-xl border px-[13px] py-[7px] text-label-sm',
        },
      }}
      input={{
        className:
          'bg-surface border-outline-variant rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
        textArea: {
          className: 'placeholder:text-on-surface-variant/50 text-body-md',
        },
        sendButton: {
          className: 'bg-primary text-on-primary rounded',
        },
      }}
    />
  );
};

export default ChatSidebar;
