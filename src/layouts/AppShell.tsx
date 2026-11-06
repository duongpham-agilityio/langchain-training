import type { ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

const AppShell = ({ sidebar, children }: AppShellProps) => (
  <div className="bg-surface flex h-screen flex-col overflow-hidden">
    <div className="flex min-h-0 flex-1">
      {sidebar}
      <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
    </div>
  </div>
);

export default AppShell;
