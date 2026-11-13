# Bug: Constants and zod schemas are hand-copied between apps/ai and apps/web and drift silently
Status: REPRODUCED

## Environment
- Branch / commit: refactor/shared-contracts-package @ 4d316a3 (based on github/practices)
- Versions: pnpm 10.33.0, Node >= 22, TypeScript ~6.0.2, macOS (Darwin 23.6.0)
- Source: GitHub issue #124 "[GF-18] One source of truth for shared values" (gap G-17)

## Setup
1. `pnpm install --frozen-lockfile` in the worktree.
2. No browser run: the defect is build-time (no shared type link between the apps), so it is shown with the TypeScript compilers. Ports reserved for this session: AI_PORT=4118, vite `--port 5118`. Not used.
Setup notes: `.claude/launch.json` only has `dev` (web, port 5173) and `storybook`; neither was started because the ticket needs no running app and 5173 is reserved by other sessions.

## Steps to reproduce
1. In `apps/ai/src/schemas/release.ts` rename the `ReleaseSchema` field `openingLine` to `summaryLine` (apps/web is untouched).
2. Run `pnpm --filter @training/ai typecheck`.
3. Run `pnpm --filter release-copilot exec tsc -b`.
4. Revert the edit.

Reproduced: always (2 of 2 runs; first attempt of the edit failed on BSD sed, second applied).

## Expected
Renaming a field of a value both apps use breaks the build of the app that was not updated (ticket "Done when").

## Actual
- Step 2 fails only on apps/ai's own consumers (`render-release.ts`, `render-release-email.ts`: TS2339 `openingLine` does not exist).
- Step 3 passes with no output: apps/web still builds against its own copy `apps/web/src/types/release-object.ts` and would send/parse `openingLine` at runtime, a silent mismatch.

## Evidence
```
src/utils/render-release.ts(49,13): error TS2339: Property 'openingLine' does not exist on type '{ version: string; date: string; summaryLine: string; ... }'.
```
Web `tsc -b`: exit 0, no errors.

Observed copies in the code (read, not only run):
- Release/change schemas: `apps/ai/src/schemas/release.ts` vs `apps/web/src/types/release-object.ts`, `release-change.ts` (comments "Mirrors apps/web ...").
- Change types: `apps/ai/src/constants/release-changes.ts` vs `apps/web/src/types/release-change.ts`.
- Format ids/labels: `apps/ai/src/constants/release-formats.ts` vs `apps/web/src/constants/release-formats.ts`.
- Tool names: `apps/ai/src/constants/tools.ts` vs `apps/web/src/constants/agent-tools/tools-name.ts`.
- Agent id: `apps/ai/src/constants/server.ts` vs `apps/web/src/constants/agent-tools/agent-id.ts`.
- Time zone header `X-Time-Zone`: `apps/ai/src/constants/server.ts` vs `apps/web/src/constants/config/time-zone.ts`.
- Route paths: `apps/ai/src/constants/{slack,release-history,threads}.ts` vs `apps/web/src/constants/endpoints.ts`.
- Slack limit: ai `SLACK_MAX_CONTENT_LENGTH = 35_000` vs web `slack-publish-request.ts` `MAX_CONTENT_LENGTH = 35_000` (literal copy) vs web `PLATFORM_CHARACTER_LIMITS.slack = 3000` (already drifted, and unused).
- Slack publish request, release history record/save/list, thread summary schemas: ai `schemas/*` vs web `types/*`.
- Dead on web (grep found no use outside their own definition): `PLATFORM_CHARACTER_LIMITS` (and its `APP_STORE_CHARACTER_LIMIT`, `GOOGLE_PLAY_CHARACTER_LIMIT`, `RELEASE_TITLE_CHARACTER_BUDGET` siblings), `SLACK_ERROR_MESSAGES`, `SLACK_WEBHOOK_TIMEOUT_MS`. `KnownPlatformId` is used by use-release-history.ts.
- Web sends `agentId` / `resourceId` query params to `/api/memory/threads` (`use-thread-session.ts:105`); `apps/ai/src/routes/threads.ts` scopes by session user id and ignores them.

## Suspected area
Failing step: 3 (web build does not fail).
Files:
```ts
// apps/web/src/types/release-object.ts:5
export const ReleaseSchema = z.object({ version: ..., date: z.string().regex(/^\d{8}$/), openingLine: ..., changes: ... });
// apps/ai/src/schemas/release.ts:50
export const ReleaseSchema = z.object({ version: ..., date: ..., openingLine: ..., changes: ... });
```
Why: two independent definitions with no shared package or import between apps. This is a suspicion based on the code read and the run above, not a root cause beyond that.

## Questions for the reporter
1. Dependency on #80 (F-11) is still open. Assumption: proceed against current code; note it in the PR.
2. Server routes with no web caller (`latest-version`, `next-version`, `/api/release-email/render`): keep or remove? Assumption: keep, with a code note (removing API surface is outside "one source of truth"); path constants still move to the shared package.
