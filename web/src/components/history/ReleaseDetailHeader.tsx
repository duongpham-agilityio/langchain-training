import { useState } from 'react';
// TODO(coming-soon): restore MessageCircle / Trash2 with the Open in new thread and
// Remove from history items below.
import { Copy, Download, Link2, MoreHorizontal, Send } from 'lucide-react';
import Badge, { BadgeVariant } from '@/components/common/Badge.tsx';
import Button, {
  ButtonSize,
  ButtonVariant,
} from '@/components/common/Button.tsx';
import DropdownMenu from '@/components/common/DropdownMenu.tsx';
import IconButton from '@/components/common/IconButton.tsx';
import { ReleaseSendStatus, type ReleaseHistoryItem } from '@/types/release.ts';

interface ReleaseDetailHeaderProps {
  item: ReleaseHistoryItem;
  onSendToSlack: () => void;
  // True while the Slack post is in flight — the button locks until it lands.
  isSending: boolean;
  onExport: () => void;
  onCopy: () => void;
  // TODO(coming-soon): onOpenInNewThread / onRemove come back with their menu items.
  // onOpenInNewThread: () => void;
  onCopyLink: () => void;
  // onRemove: () => void;
}

const ReleaseDetailHeader = ({
  item,
  onSendToSlack,
  isSending,
  onExport,
  onCopy,
  // onOpenInNewThread,
  onCopyLink,
  // onRemove,
}: ReleaseDetailHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { version, title, date, platformLabel, sendStatus } = item;
  const isSent = sendStatus === ReleaseSendStatus.Sent;

  const runMenuAction = (action: () => void) => () => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <div className="shrink-0 pt-5.5 pr-6 pl-8">
      <div className="border-outline-subtle flex items-start justify-between gap-4 border-b pb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-on-surface text-[26px] leading-8 font-bold tracking-[-0.02em] tabular-nums">
              {title}
            </h2>
            <span className="border-outline-strong bg-surface-container-lowest text-on-surface-variant inline-flex h-5.5 items-center rounded-md border px-2 text-xs font-medium whitespace-nowrap">
              {platformLabel}
            </span>
            <Badge variant={isSent ? BadgeVariant.Brand : BadgeVariant.Neutral}>
              {isSent ? 'Sent to Slack' : 'Not sent'}
            </Badge>
          </div>
          <div className="text-on-surface-variant mt-1.5 truncate text-[15px]">
            {version}
          </div>
          <div className="text-on-surface-muted mt-1 text-[12.5px]">
            Archived {date}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            onClick={onSendToSlack}
            disabled={isSending}
          >
            <Send className="size-3.5" />
            {isSending
              ? 'Sending…'
              : isSent
                ? 'Resend to Slack'
                : 'Send to Slack'}
          </Button>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            onClick={onExport}
          >
            <Download className="size-3.5" />
            Export
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Sm}
            onClick={onCopy}
            className="shadow-sm"
          >
            <Copy className="size-3.5" />
            Copy
          </Button>
          <div className="relative">
            <IconButton
              icon={<MoreHorizontal className="size-4" />}
              aria-label="More actions"
              isOutlined
              isActive={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
            />
            <DropdownMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              align="end"
              className="top-10"
            >
              {/* TODO(coming-soon): Open in new thread — to be implemented later.
              <DropdownMenu.Item
                icon={<MessageCircle className="size-3.75" />}
                onClick={runMenuAction(onOpenInNewThread)}
              >
                Open in new thread
              </DropdownMenu.Item>
              */}
              <DropdownMenu.Item
                icon={<Link2 className="size-3.75" />}
                onClick={runMenuAction(onCopyLink)}
              >
                Copy link
              </DropdownMenu.Item>
              {/* TODO(coming-soon): Remove from history — to be implemented later.
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                icon={<Trash2 className="size-3.75" />}
                onClick={runMenuAction(onRemove)}
                danger
              >
                Remove from history
              </DropdownMenu.Item>
              */}
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleaseDetailHeader;
