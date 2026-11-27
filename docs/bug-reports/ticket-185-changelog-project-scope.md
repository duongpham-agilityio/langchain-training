# Bug: Changelog query in project A returns releases from other projects
Status: REPRODUCED

## Environment
- Branch / commit: fix/changelog-project-scope @ 48be459 (the app ran from the main checkout `practices` @ 48be459, which has the same committed code)
- Versions: AI model `gpt-5.4-mini` (from the `ai-mini` launch entry); web on Vite dev server; OS / browser: macOS, Claude in-app browser
- Source: GitHub issue #185 (https://github.com/duongpham-agilityio/langchain-training/issues/185); related #168, #169

## Setup
1. `preview_start` `ai-mini` (main checkout's `.claude/launch.json`): agent server on port 4000, CopilotKit runtime at `/api/copilotkit`, `createAgent` model `gpt-5.4-mini`.
2. `preview_start` `dev`: web on port 5173, logged in as the test account already in the browser session.
3. Checked project data in `/changelog`: project "Sidebar preview test" has no releases; project "Latency test" has release v1.0.0 dated Nov 27, 2026 with 6 changes.

Setup notes:
- The worktree has no `apps/ai/.env` (gitignored). The run used the main checkout, which has `.env`. The `.env` was not read.
- The preview tool reads the main checkout's `.claude/launch.json`, not the worktree's `ai` entry, so the worktree cannot be started through it as-is.
- No production code or tests changed. The only new file is this report.

## Steps to reproduce
1. Open the sidebar project "Sidebar preview test" (project A; `/changelog` shows no releases for it).
2. Click "New chat in Sidebar preview test".
3. Send the message: `is there any changelog in November 2026?`
4. Read the answer.

Reproduced: 2 of 2 runs. Both runs gave the same answer. The first run was in a new chat, the second in the same chat.

## Expected
Only project A's data is used. The agent reports that project A has no changelog in November 2026 and builds no release notes from other projects.

## Actual
The agent answers: "Yes — there was 1 release in November 2026, with 6 changes." It shows the release "1.0.0 — 2026-11-27" with these items:
- Add release history search by version.
- Stop truncating long Slack messages over 400 characters.
- Cache the monthly changelog query.
- Add a project switcher in the sidebar.
- Redirect to login when the session expires.
- Remove the old /release-history/legacy route.

These are the items of "Latency test" v1.0.0, a different project, so the release belongs to another project.

## Evidence
- The `/changelog` page with the project filter set to "Sidebar preview test" shows no releases after Apply. It shows the "Latency test" release only when no project is selected.
- The chat answer above, from both runs.
- Code read (matches the run):
  - `apps/ai/src/tools/get-changelog.ts:36-39`: the agent tool passes only `userId` and the date range.
  - `apps/ai/src/utils/changelog.ts:49-52`: the project filter applies only when `projectId` is set.

## Suspected area
Failing step: 4 (the agent answers from the changelog tool)
Files:
```ts
// apps/ai/src/tools/get-changelog.ts:36
const { releases, nextCursor } = await listChangelog(pool, userId, {
  ...range,
  limit: CHANGELOG_TOOL_LIMIT,
});
```
```ts
// apps/ai/src/utils/changelog.ts:49
if (projectId) {
  params.push(projectId);
  where.push(`h.project_id = $${params.length}`);
}
```
Why: the chat run is in project "Sidebar preview test", but the tool never passes that project, so `buildChangelogQuery` filters only by owner and returns "Latency test"'s release. This is a suspicion from the code and matches the run; the SQL itself was not inspected in a live database.

## Questions for the reporter
1. Is "project A" the sidebar project the chat was started in? Assumption: yes, "Sidebar preview test".
2. Does the ticket's environment use the same model (`gpt-5.4-mini`)? Assumption: the same behavior applies with any model, since the bug is in the query scope.
3. Were the six changes also built as release notes in the answer, or only listed in chat? Assumption: both, as shown in the run.
