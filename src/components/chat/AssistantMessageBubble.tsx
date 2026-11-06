import type { CopilotChatAssistantMessageProps } from '@copilotkit/react-core/v2';
import {
  CopilotChatAssistantMessage,
  CopilotChatToolCallsView,
} from '@copilotkit/react-core/v2';
// TODO(coming-soon): restore these imports with the Regenerate / feedback buttons below.
// import { RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react';
// import IconButton, { IconButtonSize } from '@/components/common/IconButton.tsx';
// import { useComingSoon } from '@/hooks/use-coming-soon.ts';
import CopyButton from '@/components/common/CopyButton.tsx';
import { useToast } from '@/hooks/use-toast.ts';
import { ToastKind } from '@/store/toast-store.ts';
import { copyText } from '@/lib/clipboard.ts';
import { cn } from '@/lib/cn.ts';

// The markdown renderer (Streamdown) ships class names our Tailwind build
// never sees, so its output arrives with browser-default heading sizes and
// paragraph margins. Typography is applied here instead, on the same scale
// the design uses for assistant prose (14px/1.65, no bubble).
const MARKDOWN_CLASSES = cn(
  '[&_p]:my-0 [&_p:not(:first-child)]:mt-3',
  '[&_strong]:font-semibold',
  '[&_h1]:text-body-md [&_h2]:text-body-md [&_h3]:text-body-sm',
  '[&_h1]:mt-4 [&_h2]:mt-4 [&_h3]:mt-4',
  '[&_h1]:mb-1.5 [&_h2]:mb-1.5 [&_h3]:mb-1.5',
  '[&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold',
  '[&_ul]:mt-2 [&_ul]:mb-0 [&_ul]:flex [&_ul]:list-none [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-0',
  '[&_li]:relative [&_li]:pl-4.5',
  "[&_ul>li]:before:bg-primary [&_ul>li]:before:absolute [&_ul>li]:before:top-2.5 [&_ul>li]:before:left-0 [&_ul>li]:before:size-1.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:content-['']",
  '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5',
  '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
  '[&_code]:bg-surface-container [&_code]:rounded-md [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12.5px]',
  '[&_pre]:bg-surface-container-low [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:p-3',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
);

// The design gives the assistant turn no bubble: just a plain column of
// text, tool cards and row actions.
// TODO(coming-soon): Regenerate and Good/Bad response actions are disabled
// until they are implemented (they only opened the Coming soon dialog).
const AssistantMessageBubble = ({
  message,
  messages,
}: CopilotChatAssistantMessageProps) => {
  const { showToast } = useToast();
  // const { showComingSoon } = useComingSoon();

  if (!message.content && !message.toolCalls?.length) return null;

  const handleCopy = async (): Promise<boolean> => {
    const isCopied = await copyText(message.content ?? '');
    showToast(
      isCopied
        ? { kind: ToastKind.Success, title: 'Message copied' }
        : { kind: ToastKind.Error, title: 'Couldn’t copy message' },
    );
    return isCopied;
  };

  return (
    <div className="flex w-full flex-col gap-2.5">
      {message.content && (
        <div
          className={cn(
            'text-body-md text-on-surface leading-[1.65]',
            MARKDOWN_CLASSES,
          )}
        >
          <CopilotChatAssistantMessage.MarkdownRenderer
            content={message.content}
          />
        </div>
      )}
      <CopilotChatToolCallsView message={message} messages={messages} />
      {message.content && (
        <div className="-ml-1.5 flex items-center gap-0.5">
          <CopyButton
            isIconOnly
            aria-label="Copy message"
            className="size-7 rounded-[7px]"
            onCopy={handleCopy}
          />
          {/* TODO(coming-soon): Regenerate / Good response / Bad response —
              to be implemented later.
          <IconButton
            icon={<RotateCcw className="size-3.75" />}
            size={IconButtonSize.Sm}
            aria-label="Regenerate"
            onClick={() => showComingSoon('Regenerate response')}
          />
          <IconButton
            icon={<ThumbsUp className="size-3.75" />}
            size={IconButtonSize.Sm}
            aria-label="Good response"
            onClick={() => showComingSoon('Response feedback')}
          />
          <IconButton
            icon={<ThumbsDown className="size-3.75" />}
            size={IconButtonSize.Sm}
            aria-label="Bad response"
            onClick={() => showComingSoon('Response feedback')}
          />
          */}
        </div>
      )}
    </div>
  );
};

export default AssistantMessageBubble;
