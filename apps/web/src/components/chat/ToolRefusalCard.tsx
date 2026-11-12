import { Info } from 'lucide-react';

interface ToolRefusalCardProps {
  message: string;
}

// The render tool answered but produced no draft (unknown format, or text over
// the format's length limit). Not a failure, so no retry button: the user
// adjusts the request in the chat.
const ToolRefusalCard = ({ message }: ToolRefusalCardProps) => (
  <div
    role="status"
    className="border-outline-subtle bg-surface-container-lowest flex items-start gap-2 rounded-xl border px-3 py-2"
  >
    <Info
      className="text-on-surface-variant mt-0.5 size-4 shrink-0"
      aria-hidden="true"
    />
    <span className="text-body-md text-on-surface-variant break-words">
      {message}
    </span>
  </div>
);

export default ToolRefusalCard;
