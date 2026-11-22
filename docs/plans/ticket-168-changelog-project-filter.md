# Plan: Changelog project filter

## Goal
Changelog entries carry `projectId` and `projectName`; `GET /api/changelog?projectId=` filters (404 for a project that is not the caller's); the page shows the project name per release and has a project dropdown (default all projects).

## Assumptions
- Same filter pattern as History: `projectId` uuid, verified with `findOwnedProject`, 404 `PROJECT_NOT_FOUND_MESSAGE` otherwise (unconfirmed, follows existing code).
- The web fetches the project list itself (`GET /api/projects`) in a small `list-projects` service and `use-projects` hook; #167 may add its own, to be merged later.
- The `getChangelog` agent tool keeps listing all projects (no filter), entries just gain the project fields.

## Steps
1. Test: `buildChangelogQuery` adds `h.project_id = $n`, joins `projects` and selects `project_name`.
   Files: apps/ai/src/utils/changelog.test.ts - Change: new cases.
2. Code: contract `ChangelogEntrySchema` gets `projectId`, `projectName`; query schema gets `projectId`; SQL builder, row mapper, route check.
   Files: packages/contracts/src/changelog.ts, apps/ai/src/schemas/changelog.ts, apps/ai/src/utils/changelog.ts, apps/ai/src/routes/changelog.ts
3. Code (web): `projectId` in filters/query, project dropdown, project name badge, project list service and hook.
   Files: apps/web/src/hooks/use-changelog.ts, use-projects.ts, services/list-projects.ts, components/changelog/ChangelogFilters.tsx, ChangelogRelease.tsx, constants/query-keys.ts
4. Docs: apps/ai/CLAUDE.md changelog line.

## Done check
- `pnpm test`, `pnpm lint`, `pnpm build` all exit 0
- Preview with two projects, screenshots
