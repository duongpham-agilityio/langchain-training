import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import AppShell from '@/layouts/AppShell.tsx';
import AppSidebar from '@/layouts/AppSidebar.tsx';
import ThreadListItem from '@/components/chat/ThreadListItem.tsx';
import ComingSoonDialog from '@/components/common/ComingSoonDialog.tsx';
import ConnectionErrorDialog from '@/components/common/ConnectionErrorDialog.tsx';
import ToastViewport from '@/components/common/ToastViewport.tsx';
import { useAuth } from '@/hooks/use-auth.ts';
import { useThreadSession } from '@/hooks/use-thread-session.ts';
import { useThreadUrlSync } from '@/hooks/use-thread-url-sync.ts';
import { groupThreadsByRecency } from '@/lib/group-threads-by-date.ts';
import { ROUTE_DASHBOARD, ROUTE_HISTORY } from '@/constants/routings.ts';
import AppProviders from './providers/AppProviders';

const WORKSPACE_NAME = 'Release Builder';

// AppSidebar is shared chrome across Dashboard and History — this is the one
// place both routes mount under, so it owns collapse state and the thread
// list. Both routes show the same full thread list (History.dc.html's sidebar
// is identical to Main.dc.html's); picking a thread from History navigates
// back to the Dashboard with it open. No thread is highlighted while History
// is the open route though — the store still holds the last thread id, but
// nothing on screen belongs to it. It also mounts the app-wide overlays
// (toasts, Coming soon dialog) and the thread <-> URL sync.
const AppContent = () => {
  const location = useLocation();
  const { session, signOut } = useAuth();
  const { threadId, threads, selectThread, startNewChat } = useThreadSession();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  useThreadUrlSync();

  const isHistoryActive = location.pathname === ROUTE_HISTORY;
  const isDashboardActive = location.pathname === ROUTE_DASHBOARD;

  return (
    <AppShell
      sidebar={
        <AppSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
          workspaceName={WORKSPACE_NAME}
          onNewThread={startNewChat}
          userName={session?.user.email ?? 'Signed in'}
          onSignOut={signOut}
          isHistoryActive={isHistoryActive}
        >
          <div className="flex flex-col px-3">
            {groupThreadsByRecency(threads ?? []).map((group) => (
              <div key={group.label}>
                <div className="text-label-xs text-on-surface-muted px-2.5 pt-4 pb-1.5 font-semibold">
                  {group.label}
                </div>
                <ul className="flex flex-col gap-0.5">
                  {group.threads.map((thread) => (
                    <ThreadListItem
                      key={thread.id}
                      thread={thread}
                      isActive={isDashboardActive && thread.id === threadId}
                      time={thread.timeLabel}
                      onSelect={selectThread}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </AppSidebar>
      }
    >
      <Outlet />
      <ToastViewport />
      <ComingSoonDialog />
      <ConnectionErrorDialog />
    </AppShell>
  );
};

const App = () => (
  <AppProviders>
    <AppContent />
  </AppProviders>
);

export default App;
