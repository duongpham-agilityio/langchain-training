import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { Project, ThreadSummary } from '@training/contracts';
import ThreadListItem from '@/components/chat/ThreadListItem.tsx';
import { cn } from '@/lib/cn.ts';

interface ProjectTreeProps {
  projects: Project[];
  threads: ThreadSummary[];
  activeProjectId: string | undefined;
  activeThreadId: string | undefined;
  onSelectThread: (threadId: string) => void;
  onNewChat: (projectId: string) => void;
}

// Claude-style tree: one collapsible row per project with its chats under it.
// Only the collapsed ids are kept, so every project (including one created a
// moment ago) starts expanded.
const ProjectTree = ({
  projects,
  threads,
  activeProjectId,
  activeThreadId,
  onSelectThread,
  onNewChat,
}: ProjectTreeProps) => {
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(new Set());

  const toggle = (projectId: string) =>
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (!next.delete(projectId)) next.add(projectId);
      return next;
    });

  return (
    <ul className="flex flex-col gap-1 px-3 pt-2">
      {projects.map((project) => {
        const isExpanded = !collapsedIds.has(project.id);
        const projectThreads = threads.filter(
          (thread) => thread.projectId === project.id,
        );

        return (
          <li key={project.id}>
            <div
              className={cn(
                'group/project flex h-8.5 items-center gap-1 rounded-lg pr-1 pl-1.5',
                project.id === activeProjectId && 'bg-surface-container',
              )}
            >
              <button
                type="button"
                onClick={() => toggle(project.id)}
                aria-expanded={isExpanded}
                className="text-body-sm text-on-surface flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left font-semibold"
              >
                {isExpanded ? (
                  <ChevronDown className="size-3.5 shrink-0" />
                ) : (
                  <ChevronRight className="size-3.5 shrink-0" />
                )}
                <span className="truncate">{project.name}</span>
              </button>
              <button
                type="button"
                onClick={() => onNewChat(project.id)}
                aria-label={`New chat in ${project.name}`}
                className="text-on-surface-muted hover:bg-surface-container-high hover:text-on-surface flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            {isExpanded && (
              <ul className="flex flex-col gap-0.5 pl-3">
                {projectThreads.length === 0 ? (
                  <li className="text-label-xs text-on-surface-muted px-2.5 py-1.5">
                    No chats yet
                  </li>
                ) : (
                  projectThreads.map((thread) => (
                    <ThreadListItem
                      key={thread.id}
                      thread={thread}
                      isActive={thread.id === activeThreadId}
                      onSelect={onSelectThread}
                    />
                  ))
                )}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default ProjectTree;
