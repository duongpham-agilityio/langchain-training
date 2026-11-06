import type { ReactNode } from 'react';
import { Link } from 'react-router';
import {
  Archive,
  ChevronRight,
  Plus,
  SquareChevronLeft,
  SquareChevronRight,
} from 'lucide-react';
import { ROUTE_DASHBOARD, ROUTE_HISTORY } from '@/constants/routings.ts';
import WorkspaceSwitch from '@/components/common/WorkspaceSwitch.tsx';
import AccountMenu from '@/components/common/AccountMenu.tsx';
import Avatar, { AvatarSize } from '@/components/common/Avatar.tsx';
import BrandMark from '@/components/common/BrandMark.tsx';
import Button from '@/components/common/Button.tsx';
import IconButton from '@/components/common/IconButton.tsx';
// TODO(coming-soon): restore Search / IconButtonSize / Kbd / useComingSoon imports
// with the Search threads buttons below.
// import { Search } from 'lucide-react';
// import { IconButtonSize } from '@/components/common/IconButton.tsx';
// import Kbd from '@/components/common/Kbd.tsx';
// import { useComingSoon } from '@/hooks/use-coming-soon.ts';
import { cn } from '@/lib/cn.ts';

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  workspaceName: string;
  onNewThread: () => void;
  userName: string;
  avatarSrc?: string;
  onSignOut: () => Promise<void>;
  isHistoryActive: boolean;
  children?: ReactNode;
}

const NAV_ITEM_CLASSES =
  'flex h-8.5 items-center gap-2.5 rounded-lg px-2.5 text-body-sm font-medium';

const AppSidebar = ({
  isCollapsed,
  onToggleCollapse,
  workspaceName,
  onNewThread,
  userName,
  avatarSrc,
  onSignOut,
  isHistoryActive,
  children,
}: AppSidebarProps) => {
  // TODO(coming-soon): Search threads is disabled until it is implemented.
  // const { showComingSoon } = useComingSoon();
  // const handleSearch = () => showComingSoon('Search threads');
  // Workspace switching is disabled — the brand button is a hard reset instead:
  // full page reload back to the dashboard, dropping any in-memory draft state.
  const handleWorkspaceClick = () => window.location.assign(ROUTE_DASHBOARD);

  if (isCollapsed) {
    return (
      <aside className="bg-surface-container-low border-outline-subtle flex h-full w-16 shrink-0 flex-col items-center gap-2 overflow-hidden border-r pt-3.5 pb-3">
        <BrandMark />
        <IconButton
          icon={<SquareChevronRight className="size-4.25" />}
          aria-label="Expand sidebar"
          onClick={onToggleCollapse}
        />
        <div className="bg-outline-subtle my-1 h-px w-7" />
        <button
          type="button"
          onClick={onNewThread}
          aria-label="New thread"
          className="bg-primary hover:bg-primary-hover flex size-9 cursor-pointer items-center justify-center rounded-[9px] text-white shadow-sm"
        >
          <Plus className="size-4" />
        </button>
        {/* TODO(coming-soon): Search threads — to be implemented later.
        <IconButton
          icon={<Search className="size-4" />}
          size={IconButtonSize.Lg}
          aria-label="Search threads"
          onClick={handleSearch}
        />
        */}
        <div className="flex-1" />
        <Link
          to={ROUTE_HISTORY}
          aria-label="Release history"
          className={cn(
            'flex size-9 items-center justify-center rounded-lg',
            isHistoryActive
              ? 'bg-surface-container text-on-surface'
              : 'text-on-surface-muted hover:bg-surface-container hover:text-on-surface',
          )}
        >
          <Archive className="size-4" />
        </Link>
        <Avatar
          name={userName}
          src={avatarSrc}
          size={AvatarSize.Sm}
          className="size-7 text-[11px]"
        />
      </aside>
    );
  }

  return (
    <aside className="bg-surface-container-low border-outline-subtle flex h-full w-80 shrink-0 flex-col overflow-hidden border-r">
      <div className="flex shrink-0 items-center gap-1 pt-3 pr-3 pl-3.5">
        <WorkspaceSwitch name={workspaceName} onClick={handleWorkspaceClick} />
        <IconButton
          icon={<SquareChevronLeft className="size-4.25" />}
          aria-label="Collapse sidebar"
          onClick={onToggleCollapse}
        />
      </div>

      <div className="flex shrink-0 flex-col gap-2 px-3 pt-3.5 pb-1">
        <Button
          onClick={onNewThread}
          className="text-body-sm inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg px-3 py-0 font-semibold shadow-sm"
        >
          <Plus className="size-3.75" strokeWidth={2.2} />
          New thread
        </Button>
        {/* TODO(coming-soon): Search threads (⌘K) — to be implemented later.
        <button
          type="button"
          onClick={handleSearch}
          className="border-outline-subtle hover:border-outline-strong bg-surface-container-lowest text-on-surface-muted text-body-sm flex h-8.5 w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Search threads</span>
          <Kbd>⌘K</Kbd>
        </button>
        */}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto pb-3" aria-label="Threads">
        {children}
      </nav>

      <div className="border-outline-subtle flex shrink-0 flex-col gap-0.5 border-t px-3 pt-2 pb-3">
        <Link
          to={ROUTE_HISTORY}
          className={cn(
            NAV_ITEM_CLASSES,
            isHistoryActive
              ? 'bg-surface-container text-on-surface font-semibold'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
          )}
        >
          <Archive className="size-4" />
          <span className="flex-1">Release history</span>
          {!isHistoryActive && <ChevronRight className="size-3.5" />}
        </Link>
        <AccountMenu
          userName={userName}
          avatarSrc={avatarSrc}
          onSignOut={onSignOut}
        />
      </div>
    </aside>
  );
};

export default AppSidebar;
