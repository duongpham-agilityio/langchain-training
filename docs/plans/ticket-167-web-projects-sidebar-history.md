# Plan: ticket 167

Unconfirmed assumptions: open project = project of the open chat / last clicked project; History filter is server-side (`projectId`).

## Steps
1. `services/list-projects.ts`, `services/create-project.ts` (contracts schemas), `hooks/use-projects.ts` (query key `PROJECTS_QUERY_KEY`, create mutation).
2. `store/project-store.ts`: `activeProjectId` (persisted in localStorage); `hooks/use-active-project.ts` resolves it against the list (falls back to first project).
3. `AppProviders`: send `PROJECT_ID_HEADER` with the active project id.
4. `CreateProjectDialog` (required variant when no project, optional from sidebar "New project").
5. Sidebar tree: `ProjectTree` replaces the date-grouped list; threads grouped by `projectId`, expand/collapse, per-project new chat; selecting a thread activates its project; `startNewChat` in active project.
6. Fix placeholders: draft thread row `projectId`, archive request `projectId`.
7. History: `projectName` on item, list row and detail header; project filter select, server-side `projectId`.
8. Verify: `pnpm build`, lint, preview walkthrough.
