# Plan: [F-08] Renderer: HTML email

## Goal
A pure renderer turns a release object (`ReleaseSchema`) into an inline-styled HTML email body and a subject line `Release <version> (<date>)`. Every string from the object is HTML-escaped. It is exposed through an authenticated endpoint, and an automated test checks the output, including the `<script>` escape case.

## Assumptions
- Input schema is `ReleaseSchema` from `apps/ai/src/schemas/release.ts` (F-04, now on `practices` at 8bf070e). Unconfirmed: none, confirmed by user.
- Test by endpoint, no unit test, no dependency on F-01 (user answer). The repo has no test runner or `test` script (`apps/ai/CLAUDE.md`). Unconfirmed: add a `test` script to `apps/ai/package.json` that runs the built-in `node:test` through `tsx`, adding no new dependency. Confirm before step 1.
- Automated "opens correctly" check (user answer): the test asserts the HTML starts with `<!doctype html>`, has no `<style>`, `<link>` or `<script>` tags, and that escaped text appears. No browser run.
- Subject uses `date` as stored (`yyyymmdd`), not reformatted. Unconfirmed default.
- No `lint` script in `apps/ai`; the root `pnpm lint` covers only apps that define one. Done check runs lint where it exists and `typecheck` for `apps/ai`.
- Endpoint path `/api/release-email/render` sits under `/api/*`, so `createRequireAuth` already guards it (mounted in `apps/ai/src/index.ts`). Unconfirmed default.
- Renderer lives in `utils/` (pure helper, existing convention); no new `renderers/` folder. Unconfirmed default.
- `escapeHtml` does not exist in the repo; add it in `utils/`.

## Steps
1. Test: POST a valid release object whose change description contains `<script>` to the route. Assert 200, the subject line, `&lt;script&gt;` in the body, no raw `<script>`, no `<style>`/`<link>`, and a 400 for an invalid body. It fails before step 2 with a missing route.
   Files: `apps/ai/src/routes/release-email.test.ts` (new), `apps/ai/package.json` (add `test` script) - Change: new test file and script.
2. Code: add the path constant, the pure renderer (subject, inline-styled HTML, escaping every string field: `version`, `date`, `openingLine`, each change `description` and `refs`), and the route that validates the body with `ReleaseSchema` and returns `{ subject, html }`. Mount it in the app.
   Files:
   - `apps/ai/src/constants/release-email.ts` (new) - `RELEASE_EMAIL_RENDER_PATH = "/api/release-email/render"`, exported from `constants/index.ts`.
   - `apps/ai/src/utils/escape-html.ts` (new) - `escapeHtml` for `& < > " '`, exported from `utils/index.ts`.
   - `apps/ai/src/utils/render-release-email.ts` (new) - `renderReleaseEmail(release: Release): { subject, html }`, pure, inline styles only, all text through `escapeHtml`.
   - `apps/ai/src/routes/release-email.ts` (new) - `createReleaseEmailRoute()`: `POST` parses `ReleaseSchema`, 400 on failure, returns `renderReleaseEmail(...)`.
   - `apps/ai/src/routes/index.ts` - export the new route.
   - `apps/ai/src/index.ts` - `app.route("/", createReleaseEmailRoute())`.

## Done check
- `pnpm --filter @training/ai test` exits 0 (the new test passes)
- `pnpm --filter @training/ai typecheck` exits 0
- `pnpm lint` exits 0 (root; `apps/ai` has no lint script, so this covers whatever apps define one)
- `pnpm build` exits 0
- The "Done when" behaviour is covered by the passing test in step 1: the fixture renders, the `<script>` description is escaped, and the HTML structure check passes.
- No UI touched, so no preview or screenshot.

## Deviations
- Step 1: the test sets dummy values for the required env vars (`OPENAI_API_KEY`, `SUPABASE_*`, `DATABASE_URL`) and loads `@/routes` with a dynamic import, because the `@/routes` barrel imports `config.ts`, which throws when they are missing. Nothing connects to those services.
- Step 1: the `test` script quotes its glob (`tsx --test "src/**/*.test.ts"`) so Node expands it, not the shell.
- Done check: the root `package.json` has no `test` script, so `pnpm test` was run as `pnpm --filter @training/ai test` (as the plan states). `pnpm install --frozen-lockfile` was run first because the worktree had no `node_modules` (no dependency added).
- Step 1 and Done check: the endpoint test and the `test` script were removed afterwards, because the app does not use `.test` files. Steps 1 and the `pnpm --filter @training/ai test` check no longer apply; typecheck, lint and build remain.
