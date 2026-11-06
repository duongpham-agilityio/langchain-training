import { useState } from 'react';
// TODO(coming-soon): restore Link2 / Pencil / Pin / Trash2 / useComingSoon with the
// Rename / Pin / Copy link / Delete items below.
// import { Download, Link2, MoreHorizontal, PanelRightOpen, Pencil, Pin, Trash2 } from 'lucide-react';
// import { useComingSoon } from '@/hooks/use-coming-soon.ts';
import { Download, MoreHorizontal, PanelRightOpen } from 'lucide-react';
import Button, { ButtonVariant } from '@/components/common/Button.tsx';
import DropdownMenu from '@/components/common/DropdownMenu.tsx';
import IconButton from '@/components/common/IconButton.tsx';
import { cn } from '@/lib/cn.ts';

interface ThreadHeaderProps {
  title: string;
  isPreviewOpen: boolean;
  onTogglePreview: () => void;
  onExportNotes: () => void;
  // False while the thread has no draft to export.
  canExportNotes: boolean;
}

// TODO(coming-soon): Rename / Pin thread / Copy link / Delete thread are disabled
// until implemented (no rename/pin/delete endpoint on a thread yet).
const ThreadHeader = ({
  title,
  isPreviewOpen,
  onTogglePreview,
  onExportNotes,
  canExportNotes,
}: ThreadHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // const { showComingSoon } = useComingSoon();
  const closeMenu = () => setIsMenuOpen(false);
  const runMenuAction = (action: () => void) => () => {
    closeMenu();
    action();
  };

  return (
    <div className="border-outline-subtle flex h-14 shrink-0 items-center justify-between gap-4 border-b pr-4 pl-6">
      <h1 className="text-body-md text-on-surface min-w-0 truncate font-semibold">{title}</h1>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant={ButtonVariant.Secondary}
          onClick={onTogglePreview}
          aria-pressed={isPreviewOpen}
          className={cn(
            'text-body-sm inline-flex h-8 items-center gap-1.5 rounded-lg px-3 py-0 font-semibold',
            isPreviewOpen &&
              'bg-primary-soft border-primary-soft-strong text-on-primary-soft hover:bg-primary-soft',
          )}
        >
          <PanelRightOpen className="size-3.75" />
          Preview
        </Button>
        <div className="relative">
          <IconButton
            icon={<MoreHorizontal className="size-4.25" />}
            aria-label="Thread options"
            onClick={() => setIsMenuOpen((open) => !open)}
          />
          <DropdownMenu isOpen={isMenuOpen} onClose={closeMenu} align="end" className="top-9">
            {/* TODO(coming-soon): Rename / Pin thread / Copy link — to be implemented later.
            <DropdownMenu.Item icon={<Pencil className="size-4" />} hint="R" onClick={runMenuAction(() => showComingSoon('Rename thread'))}>
              Rename
            </DropdownMenu.Item>
            <DropdownMenu.Item
              icon={<Pin className="size-4" />}
              onClick={runMenuAction(() => showComingSoon('Pin thread'))}
            >
              Pin thread
            </DropdownMenu.Item>
            <DropdownMenu.Item
              icon={<Link2 className="size-4" />}
              onClick={runMenuAction(() => showComingSoon('Copy thread link'))}
            >
              Copy link
            </DropdownMenu.Item>
            */}
            <DropdownMenu.Item
              icon={<Download className="size-4" />}
              disabled={!canExportNotes}
              onClick={runMenuAction(onExportNotes)}
            >
              Export notes
            </DropdownMenu.Item>
            {/* TODO(coming-soon): Delete thread — to be implemented later.
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              icon={<Trash2 className="size-4" />}
              onClick={runMenuAction(() => showComingSoon('Delete thread'))}
              danger
            >
              Delete thread
            </DropdownMenu.Item>
            */}
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default ThreadHeader;
