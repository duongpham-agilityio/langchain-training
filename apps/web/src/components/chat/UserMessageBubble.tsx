import type { CopilotChatUserMessageProps } from '@copilotkit/react-core/v2';
import { CopilotChatUserMessage } from '@copilotkit/react-core/v2';
import { summarizeEditRequest } from '@/lib/release-notes/summarize-edit-request.ts';

// The design gives the user turn no avatar or name label — just a tinted
// bubble hugging the right edge, notched at its bottom-right corner.
const UserMessageBubble = ({ message }: CopilotChatUserMessageProps) => {
  const raw = typeof message.content === 'string' ? message.content : '';
  // An edit request from the Live Preview carries the release JSON for the agent: show one line.
  const content = summarizeEditRequest(raw) ?? raw;

  return (
    <div className="flex w-full justify-end">
      <div className="bg-surface-container text-on-surface text-body-md max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2.5 leading-[1.55]">
        <CopilotChatUserMessage.MessageRenderer
          content={content}
          className="text-on-surface! max-w-none! rounded-none! bg-transparent! p-0!"
        />
      </div>
    </div>
  );
};

export default UserMessageBubble;
