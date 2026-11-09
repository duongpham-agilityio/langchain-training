# Plan: [M-09] Web sign-in works against the new setup

## Goal
Web sign-in (email/password and GitHub) lands on the Dashboard, sign-out returns to the sign-in page, and the agent request carries the bearer token. A signed-out user is kept off the agent route. Everything that can be proven without live Supabase credentials and M-08 is fixed and documented; the rest is a written checklist.

## Assumptions
- Unconfirmed: the random 1-4 s `setTimeout` in `use-auth.ts` is a debug leftover and should go.
- Unconfirmed: M-09 does not wait for M-08 (#11, open, `apps/ai/src/middlewares/` empty). The 401 check is recorded as pending M-08.
- Unconfirmed: redirect to `/sign-in` is enough for the signed-out UI; no new 401 UI (M-31 owns error/recovery UI).
- No test runner exists in this repo (`CLAUDE.md`), so no test step. Verification is `pnpm typecheck`, `pnpm lint`, `pnpm build` plus the manual checklist.
- Live sign-in needs a Supabase project with the GitHub provider enabled and `apps/web/.env` filled from `.env.example`; Claude cannot read `.env*`, so live runs are left to the user.
- `AppProviders` reads `state.session!.accessToken`; it mounts only under the `App` route behind the `AppBootstrap` gate, so it never renders signed out. No change needed.

## Steps
1. Code: apply `setSession` immediately on auth state change.
   Files: `apps/web/src/hooks/use-auth.ts` - Change: drop the random-delay `setTimeout` and the unused async wrapper; call `setSession(session)` directly in the listener. Removes the stale-session-after-sign-out race and the up-to-4 s wait before the Dashboard.
2. Docs: write the live verification checklist.
   Files: `docs/verification/m-09-web-sign-in.md` (new) - Change: env setup (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_SERVER_URL`, GitHub provider redirect URL `http://localhost:5173/`), steps and expected result for email sign-in, GitHub sign-in, sign-out, bearer header present on the `/api/copilotkit` request (DevTools Network), and the signed-out 401 check with a `curl` without a token (pending M-08). Result column left unchecked.

## Done check
- `pnpm typecheck`, `pnpm lint`, `pnpm build` all exit 0
- Code read confirms: both sign-in paths end in `onAuthStateChange` -> `setSession` -> `AppBootstrap` redirect to Dashboard; `AppProviders` sends `Authorization: Bearer <access token>`
- Live sign-in runs and the 401 check are listed as pending (credentials, M-08) in the checklist and the PR
