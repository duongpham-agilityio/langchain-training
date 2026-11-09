interface SlackPublishConfirmCardProps {
  label?: string;
  content?: string;
  answer?: string;
  canRespond: boolean;
  onRespond: (answer: 'approved' | 'rejected') => void;
}

// Approve/Reject card for the agent's confirmSlackPublish request.
const SlackPublishConfirmCard = ({
  label,
  content,
  answer,
  canRespond,
  onRespond,
}: SlackPublishConfirmCardProps) => (
  <div className="bg-surface-container-lowest border-outline-subtle flex w-full max-w-110 flex-col gap-2.5 rounded-xl border p-3 shadow-sm">
    <span className="text-on-surface text-[13.5px] leading-5 font-semibold">
      Publish {label ? `“${label}” ` : ''}release notes to Slack?
    </span>
    {content && (
      <pre className="text-on-surface-muted bg-surface-container max-h-32 overflow-auto rounded-lg p-2 text-[12px] leading-4 whitespace-pre-wrap">
        {content}
      </pre>
    )}
    {answer ? (
      <span className="text-on-surface-variant text-[12px] font-semibold">
        {answer === 'approved' ? 'Approved' : 'Rejected'}
      </span>
    ) : (
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canRespond}
          onClick={() => onRespond('approved')}
          className="bg-primary text-on-primary cursor-pointer rounded-lg px-3 py-1.5 text-[12.5px] font-semibold disabled:cursor-default disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={!canRespond}
          onClick={() => onRespond('rejected')}
          className="border-outline-subtle text-on-surface cursor-pointer rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold disabled:cursor-default disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    )}
  </div>
);

export default SlackPublishConfirmCard;
