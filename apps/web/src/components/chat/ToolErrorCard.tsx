import { AlertTriangle } from 'lucide-react';

interface ToolErrorCardProps {
  toolName: string;
  detail: string;
}

const ToolErrorCard = ({ toolName, detail }: ToolErrorCardProps) => (
  <div
    role="alert"
    className="border-error/30 bg-error/5 flex flex-col gap-1 rounded-xl border px-3 py-2"
  >
    <span className="text-label-sm text-error flex items-center gap-2">
      <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
      Release Builder sent unusable data for <code className="font-mono">{toolName}</code>
    </span>
    <span className="text-body-md text-on-surface-variant break-words">
      Nothing was updated on screen. Ask Release Builder to try again — it usually
      succeeds on a second attempt.
    </span>
    <span className="text-label-sm text-on-surface-variant/70 break-words">
      {detail}
    </span>
  </div>
);

export default ToolErrorCard;
