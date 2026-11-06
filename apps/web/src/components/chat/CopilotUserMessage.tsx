import { AlertCircle, RotateCcw } from 'lucide-react';
import {
  CopilotChatUserMessage,
  type CopilotChatUserMessageProps,
} from '@copilotkit/react-core/v2';
import { useChatSendFailure } from '@/hooks/use-chat-send-failure.ts';

// Passed as CopilotChat's `messageView.userMessage` slot: the built-in user
// message, plus an inline "failed to send" notice with Retry under the message
// whose run failed (see useChatSendFailureListener).
const CopilotUserMessage = (props: CopilotChatUserMessageProps) => {
  const { failure, retry } = useChatSendFailure(props.message.id);

  return (
    <div>
      <CopilotChatUserMessage
        {...props}
        messageRenderer="bg-primary! text-white! rounded-br-none!"
      />
      {failure && (
        <div
          role="alert"
          className="text-body-sm 100% flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-right"
        >
          <span className="text-error flex items-center gap-1.5 font-medium">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            {failure.title}
          </span>
          <button
            type="button"
            onClick={retry}
            className="text-primary flex cursor-pointer items-center gap-1 font-semibold hover:underline"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Retry
          </button>
          <span className="text-label-sm text-on-surface-variant/70 w-full wrap-break-word">
            {failure.detail}
          </span>
        </div>
      )}
    </div>
  );
};

// The slot is typed as `typeof CopilotChatUserMessage`, sub-components
// included, so carry them over.
export default Object.assign(CopilotUserMessage, CopilotChatUserMessage);
