import { useState } from 'react';

interface EditApprovalCardProps {
  // The sentence being replaced and its replacement; `before` is missing when the item is unknown.
  before?: string;
  after?: string;
  onAccept: () => void;
  onReject: () => void;
}

// Accept/Reject card for the agent's edit approval (AG-UI interrupt). Shows the old and the new
// sentence; buttons lock after the first click so one answer cannot be sent twice.
const EditApprovalCard = ({
  before,
  after,
  onAccept,
  onReject,
}: EditApprovalCardProps) => {
  const [answered, setAnswered] = useState<'accepted' | 'rejected' | null>(
    null,
  );

  const answer = (next: 'accepted' | 'rejected', callback: () => void) => {
    if (answered) return;
    setAnswered(next);
    callback();
  };

  return (
    <div className="bg-surface-container-lowest border-outline-subtle flex w-full max-w-110 flex-col gap-2.5 rounded-xl border p-3 shadow-sm">
      <span className="text-on-surface text-[13.5px] leading-5 font-semibold">
        Replace this sentence in the release notes?
      </span>
      {before !== undefined && (
        <div className="flex flex-col gap-1">
          <span className="text-on-surface-variant text-[11px] font-semibold uppercase">
            Before
          </span>
          <p className="text-on-surface-muted bg-surface-container rounded-lg p-2 text-[12px] leading-4 line-through">
            {before}
          </p>
        </div>
      )}
      {after !== undefined && (
        <div className="flex flex-col gap-1">
          <span className="text-on-surface-variant text-[11px] font-semibold uppercase">
            After
          </span>
          <p className="text-on-surface bg-surface-container rounded-lg p-2 text-[12px] leading-4">
            {after}
          </p>
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={answered !== null}
          onClick={() => answer('accepted', onAccept)}
          className="bg-primary text-on-primary cursor-pointer rounded-lg px-3 py-1.5 text-[12.5px] font-semibold disabled:cursor-default disabled:opacity-50"
        >
          {answered === 'accepted' ? 'Accepted' : 'Accept'}
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

export default EditApprovalCard;
