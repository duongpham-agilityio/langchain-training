# Plan: One source of truth for shared values (GF-18, issue #124)

## Goal
A new workspace package holds the zod schemas and constants that `apps/ai` and `apps/web` both use today, and both apps import them from it. Renaming a field in the shared schema breaks the typecheck/build of whichever app was not updated. Dead copies are deleted.

## Assumptions
- Issue depends on #80 (F-11), still open. Proceeding against current code; note in the PR.
- No test runner exists in this repo (CLAUDE.md), so the "test" step is a drift proof run with the compilers (rename a shared field, expect both apps to fail, revert), not a unit test.
- Package is source-only (TypeScript, no build step), named `@training/contracts` at `packages/contracts`. `exports` points at `src/index.ts`. Web (Vite, Bundler resolution) consumes it directly. `apps/ai` bundles with tsup, so tsup must inline it (`--noExternal @training/contracts`); `tsx` in dev handles TS from the symlinked workspace path.
- `pnpm-workspace.yaml` gets `packages/*`; Turbo already runs `typecheck`/`build` per package, so the package gets a `typecheck` script only (no `build`), and apps depend on it via `workspace:*`.
- zod: ai has ^4.6.7, web ^4.4.3. The package declares `zod` as a peer dependency (`^4.4.3`) so both apps' installs satisfy it and only one copy is resolved per app; check `pnpm install` produces no duplicate-zod type errors.
- LLM-facing `.describe(...)` text stays in the apps (ai tool input schemas, web CopilotKit tool params), applied on top of the shared plain schemas via `.extend` / `.shape[...]`. The shared schemas carry structure and limits only. Existing runtime behaviour must not change (same JSON accepted/rejected).
- Release history `entries`: ai types it `z.array(z.unknown())` ("stored and returned as-is"); web parses `ReleaseEntrySchema`. Shared record schema uses `ReleaseEntrySchema` (moved from web); ai route output must still typecheck. If ai storage can hold older shapes, keep `z.unknown()` for ai's DB row mapping and only share the response contract. Decide while implementing, note it in the PR.
- Server routes with no web caller (`GET /release-history/latest-version`, `POST /release-history/next-version`, `POST /api/release-email/render`): keep, add a one-line code note that no web client calls them; their path constants stay in ai (not shared, since there is no second consumer). Removing API surface is out of scope for "one source of truth".
- Slack limit: shared `SLACK_MAX_CONTENT_LENGTH = 35_000`; web's `PLATFORM_CHARACTER_LIMITS.slack = 3000` was already wrong and unused, so it is deleted with the rest of that object.
- Unconfirmed: nothing else in the ticket was pending.

## Steps
1. Test (drift proof, written first as a script note in the PR, not committed code): record that today renaming `openingLine` in `apps/ai/src/schemas/release.ts` leaves `apps/web` typecheck green (seen in docs/bug-reports/ticket-124-shared-contracts.md).
   Files: none - Change: none; this is the failing baseline.
2. Code: create the package.
   Files: `packages/contracts/package.json`, `packages/contracts/tsconfig.json`, `packages/contracts/src/index.ts` and modules (`constants.ts`, `release.ts`, `release-history.ts`, `slack.ts`, `threads.ts`), `pnpm-workspace.yaml`, root `package.json` unchanged - Change: define `@training/contracts` exporting:
   - constants: `CHANGE_TYPES`, `RELEASE_FORMATS`, `RELEASE_FORMAT_LABELS`, `RELEASE_STATUSES`, `RELEASE_DATE_PATTERN`, `SLACK_MAX_CONTENT_LENGTH`, `TOOL_NAMES`, `RELEASE_COPILOT_AGENT_ID`, `TIME_ZONE_HEADER`, route paths (`RUNTIME_BASE_PATH` = `/api/copilotkit`, `SLACK_PUBLISH_PATH`, `THREADS_PATH`, `RELEASE_HISTORY_PATH`);
   - schemas and types: `ChangeTypeSchema`, `ChangeSchema`, `ReleaseSchema`, `ReleaseEntrySchema`, `PlatformSlotSchema`, `SlackPublishRequestSchema`, `SaveReleaseHistoryRequestSchema`, `ReleaseHistoryRecordSchema`, `ListReleaseHistoryResponseSchema`, `ThreadSummarySchema`, `ListThreadsResponseSchema`.
3. Code: wire `apps/ai` to the package and delete its copies.
   Files: `apps/ai/package.json` (dependency + tsup `--noExternal`), `apps/ai/src/constants/{release-changes,release-formats,tools,server,slack,release-history,threads}.ts`, `apps/ai/src/schemas/{release,slack-publish,release-history,threads}.ts`, `apps/ai/src/schemas/release-notes-preview.ts`, importers - Change: re-export or import from `@training/contracts`; keep `.describe` text in ai by extending the shared schemas; keep ai-only constants (timeouts, DB names, store limits, aliases, release-email path, next/latest-version paths) where they are.
4. Code: wire `apps/web` to the package and delete its copies.
   Files: `apps/web/package.json`, `apps/web/src/types/{release-object,release-change,release-entry,release-history-record,save-release-history-request,slack-publish-request,thread}.ts`, `apps/web/src/constants/{release-formats,endpoints}.ts`, `apps/web/src/constants/agent-tools/*.ts`, `apps/web/src/constants/config/time-zone.ts`, importers - Change: import shared symbols; keep web-only `.describe` for the CopilotKit tool params via `.extend`; keep `ReleaseStatus` const enum only if still needed by UI code, otherwise derive from `RELEASE_STATUSES`.
5. Code: delete dead code.
   Files: `apps/web/src/constants/config/lib-config.ts` (`PLATFORM_CHARACTER_LIMITS`, `APP_STORE_CHARACTER_LIMIT`, `GOOGLE_PLAY_CHARACTER_LIMIT`, `RELEASE_TITLE_CHARACTER_BUDGET` if unused after grep), `apps/web/src/constants/messages.ts` (`SLACK_ERROR_MESSAGES`), `apps/web/src/constants/time.ts` (`SLACK_WEBHOOK_TIMEOUT_MS`), `apps/web/src/hooks/use-thread-session.ts` + `apps/web/src/services/list-threads.ts` - Change: remove unused exports; stop sending `agentId` / `resourceId` to `/api/memory/threads` (the server scopes by the session user). Add a one-line note on the three unused ai routes.
6. Code/docs: update `CLAUDE.md` (root layout + commands: `packages/*`) and the app CLAUDE.md cross-app wiring lines that name the copied values.
   Files: `CLAUDE.md`, `apps/ai/CLAUDE.md`, `apps/web/CLAUDE.md`.
7. Verify drift is now caught: rename `openingLine` in the shared `ReleaseSchema`, run `pnpm typecheck`, expect both `@training/ai` and `release-copilot` to fail, then revert.

## Done check
- `pnpm build`, `pnpm typecheck`, `pnpm lint` all exit 0 (no test runner exists)
- Renaming a field in the shared schema fails typecheck in both apps (step 7), then reverted
- `grep` shows no remaining hand copies of the shared constants/schemas in `apps/*/src`
- UI touched only through imports and one removed query param: run the web app with `AI_PORT=4118` and `VITE_API_SERVER_URL=http://localhost:4118` on `--port 5118 --strictPort`, load the page, no console errors

## Deviations
- Step 2: `packages/contracts/package.json` also lists `zod ^4.6.7` and `typescript` as devDependencies (besides the `zod ^4.4.3` peer dependency) so the package can typecheck on its own under pnpm. `pnpm install` added the `workspace:*` links; no external package was added.
- Step 3: `tsup` has no `--noExternal` CLI flag (`CACError: Unknown option`). Added `apps/ai/tsup.config.ts` with `noExternal: ["@training/contracts"]` and left the build script as before. Verified `dist/index.js` has no `@training/contracts` import left.
- Step 3: `apps/ai` keeps `constants/*` and `schemas/*` files that re-export the shared symbols (so the `@/constants` and `@/schemas` barrels and all ai importers stay unchanged) instead of editing every importer. `RELEASE_NOTES_DATE_PATTERN` was renamed to the shared `RELEASE_DATE_PATTERN` (3 schema files updated).
- Step 3: the shared `PlatformSlotSchema` uses `min(1)` on all three fields (web's rule); ai had plain `z.string()` but only used it as a type, and the request schema already enforced `min(1)`. ai's DB row `entries` is typed as the shared `ReleaseEntry[]` (the save path always writes `[]`) instead of `unknown[]`.
- Step 4: the web `.describe(...)` text on `ReleaseEntrySchema` and `SlackPublishRequestSchema` was dropped, not re-applied via `.extend`: neither schema is used as a CopilotKit tool parameter (only `safeParse`), so the text was never sent to a model. `ReleaseStatus` const enum kept (still used by `use-release-history.ts` and History types). `PlatformDraftSchema` in `types/release-notes-draft.ts` is now an alias of the shared `PlatformSlotSchema`. The web `COPILOTKIT_ROUTE_PATH`, `SLACK_PUBLISH_ROUTE_PATH`, `MEMORY_THREADS_ROUTE_PATH`, `RELEASE_HISTORY_ROUTE_PATH` constants were replaced by the shared `RUNTIME_BASE_PATH`, `SLACK_PUBLISH_PATH`, `THREADS_PATH`, `RELEASE_HISTORY_PATH`; `RENDER_RELEASE_NOTES_PREVIEW_TOOL_NAME` / `PUBLISH_..._TOOL_NAME` by `TOOL_NAMES.*`. `RELEASE_FORMAT_LABELS` is typed `Record<ReleaseFormat, string>`, so `release-preview-result.ts` casts it to `Record<string, string>` for the unknown-format fallback.
- Step 5: the whole of `apps/web/src/constants/config/lib-config.ts` and `constants/messages.ts` was deleted (every export was unused), plus the now-empty `constants/config/` folder; `use-thread-session.ts` also lost its now-unused `useAuth`/`session` and agent-id import. The "note on the unused ai routes" is a one-line comment on each of the three routes.
- Done check: root `pnpm typecheck` covers only `@training/ai` and `@training/contracts` (web has no `typecheck` script; its typecheck is `tsc -b` inside `pnpm build`). Step 7 therefore checked web with `npx tsc -b`.
- Done check: the web page was not loaded in a browser (the app needs Supabase env values in `.env*`, which are not readable here). Vite was started on `--port 5118 --strictPort`, served the page and `src/main.tsx` with HTTP 200, and was stopped.
