import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import IconButton from '@/components/common/IconButton.tsx';
import Input from '@/components/common/Input.tsx';

interface PreviewEditMenuProps {
  x: number;
  y: number;
  selectedText: string;
  onSubmit: (request: string) => void;
  onClose: () => void;
}

// Small floating menu under a selection inside a preview item: one input and a send button.
// Stops mousedown so a click inside does not clear the selection state that opened it.
const PreviewEditMenu = ({
  x,
  y,
  selectedText,
  onSubmit,
  onClose,
}: PreviewEditMenuProps) => {
  const [request, setRequest] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = request.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <form
      role="dialog"
      aria-label="Edit selected text"
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.key === 'Escape' && onClose()}
      onSubmit={handleSubmit}
      style={{
        left: Math.max(8, Math.min(x, window.innerWidth - 328)),
        top: y,
      }}
      className="border-outline-subtle bg-surface-container-lowest fixed z-50 flex w-80 flex-col gap-1.5 rounded-xl border p-2 shadow-lg"
    >
      <span className="text-label-sm text-on-surface-variant truncate">
        “{selectedText}”
      </span>
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <Input
            autoFocus
            value={request}
            onChange={(event) => setRequest(event.target.value)}
            placeholder="How should this change?"
            aria-label="Edit request"
          />
        </div>
        <IconButton
          type="submit"
          icon={<Send className="size-4" />}
          aria-label="Send edit request"
          disabled={!request.trim()}
        />
      </div>
    </form>
  );
};

export default PreviewEditMenu;
