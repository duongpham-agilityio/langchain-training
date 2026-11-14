import { useState } from 'react';

interface SchedulePublishConfirmCardProps {
  label?: string;
  /** Local date-time the agent proposed, `YYYY-MM-DDTHH:mm`, in the browser's zone. */
  localDateTime?: string;
  onApprove: () => void;
  onReject: () => void;
}

// Shows the proposed time the way the user will live it: weekday, date, time and the zone name.
// The server converts the same local time with the same browser zone (X-Time-Zone).
const formatLocalTime = (localDateTime: string): string => {
  const [date, time] = localDateTime.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const dayText = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `${dayText}, ${time} (${zone})`;
};

// Approve/Reject card for the agent's "schedule a Slack send" approval (AG-UI interrupt).
const SchedulePublishConfirmCard = ({
  label,
  localDateTime,
  onApprove,
  onReject,
}: SchedulePublishConfirmCardProps) => {
  const [answered, setAnswered] = useState<'approved' | 'rejected' | null>(
    null,
  );

  const answer = (next: 'approved' | 'rejected', callback: () => void) => {
    if (answered) return;
    setAnswered(next);
    callback();
  };

  return (
    <div className="bg-surface-container-lowest border-outline-subtle flex w-full max-w-110 flex-col gap-2.5 rounded-xl border p-3 shadow-sm">
      <span className="text-on-surface text-[13.5px] leading-5 font-semibold">
        Schedule {label ? `“${label}” ` : ''}release notes for Slack?
      </span>
      {localDateTime && (
        <span className="text-on-surface-muted bg-surface-container rounded-lg p-2 text-[12.5px] leading-4">
          {formatLocalTime(localDateTime)}
        </span>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={answered !== null}
          onClick={() => answer('approved', onApprove)}
          className="bg-primary text-on-primary cursor-pointer rounded-lg px-3 py-1.5 text-[12.5px] font-semibold disabled:cursor-default disabled:opacity-50"
        >
          {answered === 'approved' ? 'Approved' : 'Approve'}
        </button>
        <button
          type="button"
          disabled={answered !== null}
          onClick={() => answer('rejected', onReject)}
          className="border-outline-subtle text-on-surface cursor-pointer rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold disabled:cursor-default disabled:opacity-50"
        >
          {answered === 'rejected' ? 'Rejected' : 'Reject'}
        </button>
      </div>
    </div>
  );
};

export default SchedulePublishConfirmCard;
