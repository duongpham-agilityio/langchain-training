# Plan: Project in the backend: routes, validation, per-project version

## Goal
Every chat run, thread and saved release belongs to one project the server has verified. Two projects of one user have separate next versions and separate History; a foreign `project_id` or a `thread_id` of another user or project is rejected.

## Assumptions
- Transport (unconfirmed): `X-Project-Id` request header for runs (`PROJECT_ID_HEADER` in contracts, added to `CORS_ALLOWED_HEADERS`). REST calls use `projectId` in query or body.
- Rejection (unconfirmed): REST 404 `{ error: "Project not found" }`; run `RUN_ERROR` with `PROJECT_ACCESS_DENIED_MESSAGE`. A run with no project header is rejected.
- `next-version` stays pure (no project); `latest-version` requires `?projectId=`.
- `findReleaseId` is scoped by project too, so the same release object in another project is not reused by Slack/email/schedule.
- Project name: trimmed, 1-80 chars (new `PROJECT_NAME_MAX_LENGTH`); duplicates of a name are allowed.
- The dev database is not touched; tests use mocked pools. Preview proof runs against the dev database the user already migrated.

## Steps
1. Contracts: `packages/contracts/src/projects.ts` add `CreateProjectRequestSchema`, `ListProjectsResponseSchema`, `PROJECTS_PATH` (`/api/projects`); `constants.ts` add `PROJECT_ID_HEADER` (`X-Project-Id`); `release-history.ts` add `projectId` to `SaveReleaseHistoryRequestSchema` and `projectId`, `projectName` to `ReleaseHistoryRecordSchema`; `threads.ts` add `projectId` to `ThreadSummarySchema`.
2. Test + Code: `apps/ai/src/db/projects.ts` (`listProjects`, `createProject`, `findOwnedProject(pool, ownerId, projectId)` returning the project or null), export from `db/index.ts`; `apps/ai/src/routes/projects.ts` `createProjectsRoute(pool)`: `POST /api/projects` (201), `GET /api/projects`; mount in `index.ts`. Test the route with a mocked pool (create, list, 400 on empty name, owner scoping).
3. Test + Code: threads. `db/threads.ts`: `getThreadOwner` -> also returns project; `claimThread(pool, ownerId, projectId, id)` inserts `project_id`; `setThreadTitle` carries `projectId`; `listThreads(pool, ownerId, projectId?)` filters and returns `projectId`. `utils/thread-gate.ts`: `canUse/claim(userId, projectId, threadId)` refuse a row of another owner or another project. `utils/schedule-thread-title.ts` passes `projectId`. `routes/threads.ts`: optional `?projectId=` (validated, 404 if not owned). Update `schemas/threads.ts` re-exports and existing tests.
4. Test + Code: run context. `agent/context.ts`: keep `projectId` optional in the schema but always set in `run`. `agui/index.ts` `run`: read `x-project-id` from `this.headers`; after `identify`, verify with `findOwnedProject` (inject a `ProjectGate`/function like `ThreadGate`, optional argument, wired in `index.ts`); missing or foreign = throw `PROJECT_ACCESS_DENIED_MESSAGE` before the thread gate and any state read; put `projectId` in `context` and in trace metadata (`TRACE_METADATA_KEYS.projectId`). Tests: foreign project refused with no `getState`; project in `context`; thread of another project refused.
5. Test + Code: releases. `db/release-history.ts`: `saveReleaseHistory(pool, ownerId, projectId, {release})` inserts `project_id`; `getLatestReleaseVersion(pool, ownerId, projectId)`; `listReleaseHistory` takes `projectId` filter and joins `projects` for `projectName`; `getReleaseHistory` returns project too; `db/release-sends.ts` `findReleaseId(..., projectId)`. `utils/release-history-record.ts` + `schemas/release-history.ts` (query `projectId` optional uuid). `routes/release-history.ts`: save body `projectId` and `latest-version?projectId=` verified with `findOwnedProject`; list filter verified. Tools `release-notes-preview`, `publish-release-notes-to-slack`, `send-release-email`, `schedule-release-send` read `projectId` from the run context (no project = `{ ok: false, error }`). Update their tests.
6. Docs: update `apps/ai/CLAUDE.md` and root `CLAUDE.md` (routes, header, gate, per-project version).
7. Preview proof: start `pnpm dev:ai` against the dev database; with a real Supabase session token (user supplies or sign-in via the web app; never read `.env*`) call `POST /api/projects` twice, save a release in each, `latest-version` per project differs, History filter and `projectName`, foreign project id on save, list and on a run; one real CopilotKit chat run with `X-Project-Id` to prove header to runtime context (check the saved release/thread rows carry the project). Post request and response as a comment on #166. If the real CopilotKit run cannot be done, say so in the PR.

## Done check
- `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build` all exit 0
- Tests cover: foreign project rejected (route and run), foreign/other-project thread rejected, version per project, History filter
- Preview proof posted on #166

## Deviations
- Step 5: the tools `publishReleaseNotesToSlack`, `sendReleaseEmail` and `scheduleReleaseSend` answer a run with no project with the plain string `PROJECT_REQUIRED_MESSAGE` instead of `{ ok: false, error }`, because those tools already answer with plain strings (`NOT_SIGNED_IN` etc.). `renderReleaseNotesPreview` returns `{ ok: false, error }` as planned.
- Steps 1-5 (web, outside the plan): `apps/web` has no project picker, so to keep `pnpm build` green `build-save-release-history-request.ts` sends `projectId: ''` and `use-draft-thread-row.ts` sets `projectId: ''` on the local draft thread. No UI added. Until the web ticket sends a real project, web archive calls get 400 and chat runs are refused (no `X-Project-Id`).
- Steps 2-5: a few Code files were written before their test in the same sitting, so the "see it fail first" order was not followed (tests pass now).
- Step 5: `getLatestReleaseVersion`/`findReleaseId` etc. also got new tests in `db/release-history.test.ts`, `tools/release-notes-preview.test.ts`; `pnpm install --frozen-lockfile` was run in the worktree (no dependency added).
