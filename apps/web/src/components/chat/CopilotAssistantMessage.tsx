import {
  CopilotChatAssistantMessage,
  type CopilotChatAssistantMessageProps,
} from '@copilotkit/react-core/v2';
import { RENDERED_TOOL_NAMES } from '@/constants/rendered-tools.ts';

// Passed as CopilotChat's `messageView.assistantMessage` slot: the built-in assistant message, except
// that a message with no text whose tool calls draw nothing is skipped. Without this the agent's
// internal tool calls (load_skill, ...) each showed an empty row with copy and tool buttons.
const CopilotAssistantMessage = (props: CopilotChatAssistantMessageProps) => {
  const { content, toolCalls } = props.message;
  const hasText = typeof content === 'string' && content.trim() !== '';
  const hasRenderedTool = (toolCalls ?? []).some((call) =>
    RENDERED_TOOL_NAMES.has(call.function.name),
  );

  if (!hasText && !hasRenderedTool) return null;
  return <CopilotChatAssistantMessage {...props} />;
};

// The slot is typed as `typeof CopilotChatAssistantMessage`, sub-components included, so carry them over.
export default Object.assign(
  CopilotAssistantMessage,
  CopilotChatAssistantMessage,
);
