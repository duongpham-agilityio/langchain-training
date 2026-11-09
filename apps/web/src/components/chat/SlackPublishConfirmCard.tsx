import { useState } from 'react';

interface SlackPublishConfirmCardProps {
  label?: string;
  content?: string;
  onApprove: () => void;
  onReject: () => void;
}

// Approve/Reject card for the agent's Slack publish approval (AG-UI interrupt).
// Buttons lock after the first click so one approval cannot be sent twice.
const SlackPublishConfirmCard = ({
  label,
  content,
  onApprove,
  onReject,
}: SlackPublishConfirmCardProps) => {
  const [answered, setAnswered] = useState<'approved' | 'rejected' | null>(null);

  const answer = (next: 'approved' | 'rejected', callback: () => void) => {
    if (answered) return;
    setAnswered(next);
    callback();
  };

  return (
    <div className="bg-surface-container-lowest border-outline-subtle flex w-full max-w-110 flex-col gap-2.5 rounded-xl border p-3 shadow-sm">
      <span className="text-on-surface text-[13.5px] leading-5 font-semibold">
        Publish {label ? `“${label}” ` : ''}release notes to Slack?
      </span>
      {content && (
        <pre className="text-on-surface-muted bg-surface-container max-h-32 overflow-auto rounded-lg p-2 text-[12px] leading-4 whitespace-pre-wrap">
          {content}
        </pre>
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

export default SlackPublishConfirmCard;
