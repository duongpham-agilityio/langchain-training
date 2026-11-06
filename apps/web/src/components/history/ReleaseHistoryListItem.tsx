import Badge, { BadgeVariant } from '@/components/common/Badge.tsx';
import { cn } from '@/lib/cn.ts';
import { ReleaseSendStatus, type ReleaseHistoryItem } from '@/types/release.ts';

interface ReleaseHistoryListItemProps {
  item: ReleaseHistoryItem;
  isLatest: boolean;
  isSelected: boolean;
  onSelect: (item: ReleaseHistoryItem) => void;
}

// The design's `.rel` row: version + date, title, then platform and send
// status. Platform is text only — no platform brand icons.
const ReleaseHistoryListItem = ({
  item,
  isLatest,
  isSelected,
  onSelect,
}: ReleaseHistoryListItemProps) => {
  const { version, title, shortDate, platformLabel, sendStatus } = item;
  const isSent = sendStatus === ReleaseSendStatus.Sent;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-current={isSelected ? 'true' : undefined}
      className={cn(
        'flex w-full cursor-pointer flex-col gap-1.25 rounded-[10px] px-3 py-2.5 text-left transition-colors',
        isSelected ? 'bg-primary-soft' : 'hover:bg-surface-container-low',
      )}
    >
      <div className="flex w-full items-center gap-2">
        <span className="text-on-surface text-[13.5px] font-bold tracking-[-0.01em] tabular-nums">
          {title}
        </span>
        {isLatest && <Badge variant={BadgeVariant.Success}>Latest</Badge>}
        <span className="text-label-xs text-on-surface-muted ml-auto font-normal">
          {shortDate}
        </span>
      </div>
      <div className="text-body-sm text-on-surface-variant w-full truncate">
        {version}
      </div>
      <div className="text-label-xs text-on-surface-muted mt-px flex w-full items-center gap-1.5 font-normal">
        <span>{platformLabel}</span>
        <span className="ml-auto flex items-center gap-1.25">
          <span
            className={cn(
              'size-1.5 rounded-full',
              isSent ? 'bg-primary' : 'bg-outline/70',
            )}
          />
          {isSent ? 'Sent' : 'Not sent'}
        </span>
      </div>
    </button>
  );
};

export default ReleaseHistoryListItem;
