import { useState } from 'react';
import { isValidEmailAddress } from '@training/contracts';

interface EmailSendConfirmCardProps {
  label?: string;
  content?: string;
  onApprove: (recipient: string) => void;
  onReject: () => void;
}

// Approve/Reject card for the agent's email send (AG-UI interrupt). The recipient is typed here and
// travels in the approval answer only: the model never gets it. Send stays disabled while the
// address is empty or invalid (the server checks it again). Buttons lock after the first click.
const EmailSendConfirmCard = ({
  label,
  content,
  onApprove,
  onReject,
}: EmailSendConfirmCardProps) => {
  const [recipient, setRecipient] = useState('');
  const [answered, setAnswered] = useState<'approved' | 'rejected' | null>(
    null,
  );
  const isValid = isValidEmailAddress(recipient);
  const showError = recipient.trim() !== '' && !isValid;

  const send = () => {
    if (answered || !isValid) return;
    setAnswered('approved');
    onApprove(recipient.trim());
  };

  const reject = () => {
    if (answered) return;
    setAnswered('rejected');
    onReject();
  };

  return (
    <div className="bg-surface-container-lowest border-outline-subtle flex w-full max-w-110 flex-col gap-2.5 rounded-xl border p-3 shadow-sm">
      <span className="text-on-surface text-[13.5px] leading-5 font-semibold">
        Email {label ? `“${label}” ` : ''}release notes?
      </span>
      {content && (
        <pre className="text-on-surface-muted bg-surface-container max-h-32 overflow-auto rounded-lg p-2 text-[12px] leading-4 whitespace-pre-wrap">
          {content}
        </pre>
      )}
      <label className="flex flex-col gap-1">
        <span className="text-on-surface-variant text-[12px] font-medium">
          Recipient
        </span>
        <input
          type="email"
          autoComplete="off"
          placeholder="name@example.com"
          value={recipient}
          disabled={answered !== null}
          aria-invalid={showError}
          onChange={(event) => setRecipient(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && send()}
          className="border-outline-subtle bg-surface-container-lowest text-on-surface h-8 rounded-lg border px-2 text-[12.5px] disabled:opacity-50"
        />
        {showError && (
          <span role="alert" className="text-[12px] text-red-600">
            Enter a valid email address.
          </span>
        )}
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={answered !== null || !isValid}
          onClick={send}
          className="bg-primary text-on-primary cursor-pointer rounded-lg px-3 py-1.5 text-[12.5px] font-semibold disabled:cursor-default disabled:opacity-50"
        >
          {answered === 'approved' ? 'Sent' : 'Send'}
        </button>
        <button
          type="button"
          disabled={answered !== null}
          onClick={reject}
          className="border-outline-subtle text-on-surface cursor-pointer rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold disabled:cursor-default disabled:opacity-50"
        >
          {answered === 'rejected' ? 'Rejected' : 'Reject'}
        </button>
      </div>
    </div>
  );
};

export default EmailSendConfirmCard;
