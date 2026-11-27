# Plan: Scope agent changelog reads to the active project

## Goal
When the chat run is in project A, the agent's changelog answers and the release notes it builds include only project A's saved releases. A project with no releases gets "none" for that month, never another project's releases (issue #185).

## Assumptions
- Scope: the project is the one the chat run was started in, read from the run context (`X-Project-Id`, verified by `createProjectGate`). It is not read from model arguments. Source: `apps/ai/CLAUDE.md` (run context) and `apps/ai/src/agui/index.ts`.
- Default assumption (unconfirmed, bug report question 1): "project A" is the sidebar project the chat was started in.
- Without a project in the run context (the schema allows it), the tool answers the same way as the other project-scoped tools: `PROJECT_REQUIRED_MESSAGE`, no releases read. It does not fall back to all projects. Unconfirmed; the run always sets a project in practice.
- The web `/changelog` page keeps "All projects" as its default. It is a user-chosen filter, not the agent path, and is out of scope.
- Unconfirmed: the built release notes come only from `getChangelog` results (`show-changelog-answer` and `publish-changelog-page` use only what `getChangelog` returned), so scoping the read also scopes the build. Checked by reading the tools, not run.
- No new dependency.

## Steps
1. Test: a unit test for `createGetChangelog` that fails with the reported behaviour. With the run context set to project A (`projectId: A`), the test mocks `listChangelog` (`@/db`) and asserts it is called with `projectId: A`. It also asserts that a run without `projectId` returns `PROJECT_REQUIRED_MESSAGE` and never calls `listChangelog`. Today the first assertion fails: `projectId` is missing from the call.
   Files: `apps/ai/src/tools/get-changelog.test.ts` (new) - Change: test the tool with a fake pool and a fake runtime context; mock `@/db`.
2. Code: pass the run's project to the query. Read `projectId` from `readAgentContext(runtime)`. If it is missing, return `{ ok: false, error: PROJECT_REQUIRED_MESSAGE }` before any query. Otherwise pass it into `listChangelog` with the owner and the range, so `buildChangelogQuery` filters by `h.project_id`. Keep the model-facing schema (`getChangelogSchema`) unchanged: the project comes from the context, never from the model.
   Files: `apps/ai/src/tools/get-changelog.ts` - Change: take `projectId` from the context; return the existing project-required message when absent; add `projectId` to the `listChangelog` call. Also `apps/ai/src/constants/tools.ts` only if the tool description should say the answer covers the current project (optional, see Done check).
3. Regression check on the query layer: keep `buildChangelogQuery` as is. Its existing tests already cover the `projectId` filter; no change expected.
   Files: `apps/ai/src/utils/changelog.test.ts` - Change: none, unless the new test reveals a gap. Add a case that `projectId` adds a `h.project_id` condition, if not already covered.

## Done check
- `pnpm test`, `pnpm lint`, `pnpm build` all exit 0
- The new `get-changelog.test.ts` covers: project A passed to `listChangelog`; no project returns `PROJECT_REQUIRED_MESSAGE` without a query.
- Manual check (same repro as the bug report, not a UI change): project "Sidebar preview test" answers that there is no changelog for November 2026, and the built notes list no "Latency test" releases.
