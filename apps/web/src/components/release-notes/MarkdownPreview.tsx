import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/cn';
import { PREVIEW_ITEM_ATTRIBUTE } from '@/constants/preview-edit';

interface MarkdownPreviewProps {
  markdown: string | null;
  className?: string;
  // Source line -> property id; lines listed here render with the item attribute so a selection
  // inside them can be traced to its property.
  itemIds?: Map<number, string>;
}

const itemAttribute = (
  itemIds: Map<number, string>,
  line: number | undefined,
) => {
  const id = line === undefined ? undefined : itemIds.get(line);
  return id ? { [PREVIEW_ITEM_ATTRIBUTE]: id } : {};
};

const MarkdownPreview = ({
  markdown,
  className,
  itemIds,
}: MarkdownPreviewProps) => {
  if (!markdown) {
    return (
      <p className="text-body-md text-on-surface-variant">
        No content yet — paste a git log or PR text in the chat and ask Release
        Builder to draft release notes.
      </p>
    );
  }

  return (
    <div
      className={cn(
        // The design renders notes as flat sections: a 28px version title, a
        // small bold section heading, then dot-marked items — not the browser's
        // default heading ramp and disc bullets.
        '[&_h1]:text-on-surface [&_h1]:text-[28px] [&_h1]:leading-9 [&_h1]:font-bold [&_h1]:tracking-[-0.02em]',
        '[&_h2]:text-body-sm [&_h2]:text-on-surface [&_h2]:mt-6 [&_h2]:mb-2.5 [&_h2]:font-semibold',
        '[&_h3]:text-body-md [&_h3]:text-on-surface [&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:font-semibold',
        '[&_p]:text-body-md [&_p]:text-on-surface [&_p]:mb-3 [&_p]:leading-[1.65]',
        '[&_ul]:mb-3 [&_ul]:flex [&_ul]:list-none [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-0',
        '[&_li]:text-body-md [&_li]:text-on-surface [&_li]:relative [&_li]:pl-5 [&_li]:leading-[1.6]',
        "[&_li]:before:bg-primary [&_li]:before:absolute [&_li]:before:top-[9px] [&_li]:before:left-0 [&_li]:before:size-1.5 [&_li]:before:rounded-full [&_li]:before:content-['']",
        '[&_code]:text-label-xs [&_code]:bg-surface-container [&_code]:rounded [&_code]:px-1 [&_code]:font-mono',
        className,
      )}
    >
      <ReactMarkdown
        components={
          itemIds && {
            p: ({ node, ...props }) => (
              <p
                {...props}
                {...itemAttribute(itemIds, node?.position?.start.line)}
              />
            ),
            li: ({ node, ...props }) => (
              <li
                {...props}
                {...itemAttribute(itemIds, node?.position?.start.line)}
              />
            ),
          }
        }
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;
