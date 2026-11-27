import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import AppShell from '@/layouts/AppShell.tsx';
import AppSidebar from '@/layouts/AppSidebar.tsx';
import ComingSoonDialog from '@/components/common/ComingSoonDialog.tsx';
import ConnectionErrorDialog from '@/components/common/ConnectionErrorDialog.tsx';
import ToastViewport from '@/components/common/ToastViewport.tsx';
import { useAuth } from '@/hooks/use-auth.ts';
import { useThreadSession } from '@/hooks/use-thread-session.ts';
import { useThreadUrlSync } from '@/hooks/use-thread-url-sync.ts';
import ProjectTree from '@/components/project/ProjectTree.tsx';
import CreateProjectDialog from '@/components/project/CreateProjectDialog.tsx';
import { useActiveProject } from '@/hooks/use-active-project.ts';
import { ROUTE_CHANGELOG, ROUTE_DASHBOARD, ROUTE_HISTORY } from '@/constants/routings.ts';
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
  const { threadId, threads, selectThread, startNewChatInProject } =
    useThreadSession();
  const { projects, isProjectsLoading, activeProject, setActiveProjectId } =
    useActiveProject();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const hasNoProject = !isProjectsLoading && projects?.length === 0;

  // A reload or pasted link opens a thread without going through selectThread:
  // follow it to its project so the next run sends the right X-Project-Id.
  const openThreadProjectId = threads?.find((thread) => thread.id === threadId)?.projectId;
  useEffect(() => {
    if (openThreadProjectId) setActiveProjectId(openThreadProjectId);
  }, [openThreadProjectId, setActiveProjectId]);
  useThreadUrlSync();

  const isHistoryActive = location.pathname === ROUTE_HISTORY;
  const isChangelogActive = location.pathname === ROUTE_CHANGELOG;
  const isDashboardActive = location.pathname === ROUTE_DASHBOARD;

  return (
    <AppShell
      sidebar={
        <AppSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
          workspaceName={WORKSPACE_NAME}
          onNewProject={() => setIsCreatingProject(true)}
          userName={session?.user.email ?? 'Signed in'}
          onSignOut={signOut}
          isHistoryActive={isHistoryActive}
          isChangelogActive={isChangelogActive}
        >
          <ProjectTree
            projects={projects ?? []}
            threads={threads ?? []}
            activeProjectId={activeProject?.id}
            activeThreadId={isDashboardActive ? threadId : undefined}
            onSelectThread={selectThread}
            onNewChat={startNewChatInProject}
          />
        </AppSidebar>
      }
    >
      {hasNoProject ? null : <Outlet />}
      {hasNoProject && <CreateProjectDialog isRequired />}
      {isCreatingProject && !hasNoProject && (
        <CreateProjectDialog onClose={() => setIsCreatingProject(false)} />
      )}
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
