# Plan: [F-03] Browser time zone reaches the server

## Goal
Every web request carries the browser IANA zone in `X-Time-Zone`. The server validates it, stores it beside the user id in `userContext`, falls back to `America/New_York`, and the default release date uses it.

## Assumptions
- Header is `X-Time-Zone` (unconfirmed).
- Web date display is unchanged (unconfirmed).
- No test runner exists in this repo (CLAUDE.md), so "test" steps are a throwaway `tsx` check script outside the repo tree, not committed. No Temporal dependency (that is #71); validation uses `Intl.DateTimeFormat`.

## Steps
1. Code (server constants): rename `RELEASE_NOTES_TIME_ZONE` to `DEFAULT_TIME_ZONE` and add `TIME_ZONE_HEADER = "X-Time-Zone"`; add the header to `CORS_ALLOWED_HEADERS`.
   Files: apps/ai/src/constants/release-notes.ts, apps/ai/src/constants/server.ts - Change: as described.
2. Code (resolver + context): add `resolveTimeZone(value)` (trim, try `new Intl.DateTimeFormat("en-CA", { timeZone })`, on throw or empty return `DEFAULT_TIME_ZONE`) in `utils/time-zone.ts`, exported from the barrel. Widen `userContext` store to `{ userId, timeZone }` and add `getUserTimeZone()` returning the stored zone or the default.
   Files: apps/ai/src/utils/time-zone.ts, apps/ai/src/utils/user-context.ts, apps/ai/src/utils/index.ts - Change: as described.
3. Code (middleware): `userContextMiddleware` reads `X-Time-Zone`, runs it through `resolveTimeZone`, passes it into `userContext.run`. Covers `/api/*` (CopilotKit) and the REST routes mounted outside `/api` — check `index.ts`: `RELEASE_HISTORY_PATH*` and `SLACK_PATH_PATTERN` currently get only `requireAuth`, so mount `userContextMiddleware` after `requireAuth` there too.
   Files: apps/ai/src/middlewares/user-context.ts, apps/ai/src/index.ts - Change: as described.
4. Code (default date): `formatReleaseDate` default `timeZone` becomes `getUserTimeZone()` (evaluated per call). `release-notes-preview.ts` and `db/release-history.ts` keep calling `formatReleaseDate()`.
   Files: apps/ai/src/utils/release-title.ts - Change: default param.
5. Code (web): add `getBrowserTimeZone()` (`Intl.DateTimeFormat().resolvedOptions().timeZone`) in `lib/`, a `TIME_ZONE_HEADER` constant, send it from `AppProviders` `headers` and from `getAuthHeader` (rename not needed; add sibling `getRequestHeaders` or extend it, keep `HttpClient` untouched).
   Files: apps/web/src/lib/time-zone.ts, apps/web/src/constants/config/time-zone.ts, apps/web/src/providers/AppProviders.tsx, apps/web/src/services/get-auth-header.ts - Change: as described.
6. Verify: throwaway tsx script checks `resolveTimeZone("Asia/Ho_Chi_Minh")`, `("Not/AZone")`, `(undefined)`, and that `formatReleaseDate(new Date("2026-11-10T17:30:00Z"))` inside `userContext.run({ userId, timeZone: "Asia/Ho_Chi_Minh" })` gives `20261111` while the default gives `20261110`.
   Files: scratchpad only - Change: none in repo.
7. Docs: update the `userContext`, `formatReleaseDate` and Cross-app wiring notes in apps/ai/CLAUDE.md and apps/web/CLAUDE.md.
   Files: apps/ai/CLAUDE.md, apps/web/CLAUDE.md - Change: one line each.

## Done check
- `pnpm lint`, `pnpm build`, `pnpm typecheck` all exit 0 (no `pnpm test` exists)
- Step 6 script passes: Ho Chi Minh just after local midnight gives the local date; invalid zone falls back without throwing

## Deviations
- Step 2: `utils/time-zone.ts` did not exist, so it was created (the plan wrote it as if present). `getUserTimeZone` lives in `utils/user-context.ts`; `release-title.ts` imports it relatively (`./user-context`) as a sibling, to avoid a barrel cycle.
- Step 5: `constants/config/time-zone.ts` already existed (holds `RELEASE_NOTES_DEFAULT_TIME_ZONE`), so `TIME_ZONE_HEADER` was appended to it. `getAuthHeader` was extended rather than adding a sibling; it now returns `X-Time-Zone` even when there is no access token.
- Step 6: the script imports `time-zone.ts`, `release-title.ts` and `user-context.ts` directly, not the `utils` barrel, because the barrel pulls in `config.ts`, which needs `OPENAI_API_KEY`. Before running it, `pnpm install --frozen-lockfile` was needed because the new worktree had no `node_modules` (no dependency or lockfile change).
