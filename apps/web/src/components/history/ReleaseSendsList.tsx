import type { ReleaseSendEntry } from '@training/contracts';
import Badge, { BadgeVariant } from '@/components/common/Badge.tsx';
import Button, {
  ButtonSize,
  ButtonVariant,
} from '@/components/common/Button.tsx';
import { getBrowserTimeZone } from '@/lib/time-zone.ts';

interface ReleaseSendsListProps {
  sends: ReleaseSendEntry[];
  cancellingId: string | undefined;
  onCancel: (jobId: string) => void;
}

const STATUS_BADGES: Record<
  ReleaseSendEntry['status'],
  { variant: BadgeVariant; label: string }
> = {
  sent: { variant: BadgeVariant.Success, label: 'Sent' },
  failed: { variant: BadgeVariant.Error, label: 'Failed' },
  pending: { variant: BadgeVariant.Brand, label: 'Scheduled' },
  sending: { variant: BadgeVariant.Warning, label: 'Sending' },
  cancelled: { variant: BadgeVariant.Neutral, label: 'Cancelled' },
};

// The instant is shown in the viewer's own zone, never the zone the job was scheduled in.
export const formatSendTime = (
  iso: string,
  timeZone: string = getBrowserTimeZone(),
): string =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));

const ReleaseSendsList = ({
  sends,
  cancellingId,
  onCancel,
}: ReleaseSendsListProps) => {
  if (sends.length === 0) return null;
  return (
    <section className="border-outline-variant border-b px-8 py-4">
      <h3 className="text-body-sm text-on-surface mb-2 font-semibold">Sends</h3>
      <ul className="flex flex-col gap-2">
        {sends.map(({ id, kind, channel, recipient, status, at, error }) => {
          const badge = STATUS_BADGES[status];
          const target = channel === 'email' ? `Email ${recipient}` : 'Slack';
          return (
            <li
              key={`${kind}-${id}`}
              className="flex items-start gap-3 text-[13.5px]"
            >
              <Badge variant={badge.variant}>{badge.label}</Badge>
              <div className="min-w-0 flex-1">
                <p className="text-on-surface">
                  {target} · {formatSendTime(at)}
                </p>
                {error && (
                  <p className="text-error-rose break-words">{error}</p>
                )}
              </div>
              {status === 'pending' && (
                <Button
                  variant={ButtonVariant.Secondary}
                  size={ButtonSize.Sm}
                  disabled={cancellingId === id}
                  onClick={() => onCancel(id)}
                >
                  Cancel
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default ReleaseSendsList;
