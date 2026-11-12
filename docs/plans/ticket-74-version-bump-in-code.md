# Plan: [F-05] Version bump in code

## Goal
The next release version is computed by code, not the LLM: from the previous version, the release's changes and an optional user-stated version. The user's most recent saved release version is available from the API. Tests call the running API over HTTP, not unit-test the functions alone.

## Assumptions
- Change shape follows the intent (`docs/intents/new-features.md`): each change has a `type` and a `breaking` flag. Bump rule: any `breaking` change = major, else any `feature` = minor, else patch. Unconfirmed: the exact `type` values (assumed `feature` and `fix`; any other type counts as patch).
- No previous version = `1.0.0`. A user-stated version is returned as is, with no semver check, and overrides the computed bump (unconfirmed, analysis default).
- "Most recent saved release" = latest row by `created_at` in `release_history`, scoped to the owner, as every query in `apps/ai/src/db/release-history.ts` already filters by `owner_id` (unconfirmed; analysis default said global).
- Test runner: user chose HTTP tests against the running `apps/ai` server, so no new test dependency. Tests use Node's built-in `node:test` (Node >= 22, per root `engines`) and `fetch`. No vitest.
- Routes sit behind `createRequireAuth`. Tests need a valid Supabase session token for a test user, read from the env (not hard-coded, not committed). Unconfirmed: which test user and where its token comes from.
- The bump function is pure and lives in `apps/ai/src/utils/version-bump.ts`. It is reached over HTTP only through a new route, so an endpoint is part of this ticket. Proposed: `POST /release-history/next-version` (body: previous version, changes, optional stated version; returns `{ version }`) and `GET /release-history/latest-version` (returns `{ version }` or `{ version: null }`). Unconfirmed: exact route names and body shape.
- F-01 and F-04 are assumed done (`release_history` table and history endpoints, tickets 20 and 21). Not verified in code yet.
- `apps/ai` has no `lint` script. Done check runs root `pnpm lint` only if it applies to `apps/ai`.

## Steps
1. Test: HTTP tests in `apps/ai/src/routes/release-history.test.ts` (node:test, against `BASE_URL` of the running server, auth token from env) covering: major (breaking change), minor (feature, no breaking), patch (fix only), first release (no previous version returns `1.0.0`), user-stated version returned as is, breaking wins over feature, and latest-version returns the newest saved release for the user, and `null` when none.
   Files: `apps/ai/src/routes/release-history.test.ts` (new), `apps/ai/package.json` (add `"test": "node --test src/**/*.test.ts"` style script, no new dependency) - Change: test file and script.

2. Code: pure function `nextVersion(previous, changes, statedVersion?)` in `apps/ai/src/utils/version-bump.ts`, exported from `apps/ai/src/utils/index.ts`. Parses `major.minor.patch`, applies the bump rule, no I/O.
   Files: `apps/ai/src/utils/version-bump.ts` (new), `apps/ai/src/utils/index.ts` - Change: add function and export.

3. Code: `getLatestReleaseVersion(pool, ownerId)` in `apps/ai/src/db/release-history.ts`: `select version ... where owner_id = $1 order by created_at desc, id desc limit 1`, returns `string | null`.
   Files: `apps/ai/src/db/release-history.ts`, `apps/ai/src/db/index.ts` (export if the barrel needs it) - Change: add query.

4. Code: routes `POST /release-history/next-version` and `GET /release-history/latest-version` in `apps/ai/src/routes/release-history.ts`, validated with zod schemas in `apps/ai/src/schemas/release-history.ts`, mounted through the existing `createReleaseHistoryRoutes`. Auth stays on.
   Files: `apps/ai/src/routes/release-history.ts`, `apps/ai/src/schemas/release-history.ts`, `apps/ai/src/constants` (path constants, if the repo keeps paths there) - Change: two routes and their request schemas.

5. Code (check only): confirm no LLM prompt or tool still asks the model for `version`. Read and grep only. If one exists, stop and ask the user before changing it, since that is out of this ticket's stated scope.
   Files: none changed unless the user approves - Change: none.

## Done check
- `pnpm --filter @training/ai test` exits 0 against a running `pnpm dev:ai` server with a test token in env
- `pnpm typecheck` exits 0
- `pnpm build` exits 0
- Root `pnpm lint` exits 0 if it covers `apps/ai`; otherwise noted as not applicable
- The "Done when" cases (major, minor, patch, first release, user-stated version) pass over HTTP (step 1)
- No UI touched: `preview_start` line dropped

## Deviations
- Step 1: the test script is `node --test "src/**/*.test.ts"` (quoted so Node expands the glob). The `null` case for latest-version is skipped unless `TEST_EMPTY_USER_AUTH_TOKEN` is set, because no user with zero saved releases is known (unconfirmed test-user assumption). The test reads `TEST_AUTH_TOKEN` and optional `BASE_URL` (default `http://localhost:4000`) from env only.
- Step 2 and Step 4: the version constants (`FIRST_RELEASE_VERSION`, `RELEASE_VERSION_PATTERN`, `RELEASE_CHANGE_TYPE_FEATURE`, and the two route paths) went into `apps/ai/src/constants/release-history.ts`, which the Step 2 file list does not name. Why: the app convention forbids inline magic values, and Step 4 already allows path constants there.
- Step 4: `GET /release-history/latest-version` is registered before `GET /release-history/:id`. Why: otherwise Hono matches `latest-version` as an id and answers 404.
- Step 5 (stop and ask, not changed): `apps/ai/src/schemas/release-notes-draft.ts` (`ReleaseNotesDraftSchema.version`, around lines 75-86) still tells the LLM to decide `version` ("decided by you from conversation context"). The plan says to stop and ask the user before changing this, so it is left as is. Decision needed from the user before the LLM stops choosing the version.
- Done check: `apps/ai` has no lint script, so root `pnpm lint` only runs `apps/web` (not applicable to `apps/ai`). The HTTP test run needs a live `pnpm dev:ai` server with a valid session token and a database; neither is available in this session, so the test run against the server is not done.
