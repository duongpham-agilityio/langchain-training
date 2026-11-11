# Plan: [F-02] Add Phase 2 dependencies and config

## Goal
`apps/ai` has `resend` and `@js-temporal/polyfill`, config exposes optional `RESEND_API_KEY` and `EMAIL_FROM` (default Resend test sender), `.env.example` lists them, and scheduler settings plus store limits live in `constants/`. Server starts with and without `RESEND_API_KEY`; typecheck and build pass.

## Assumptions
- Unconfirmed: scheduler values poll interval 60 s, max attempts 3, stuck-job timeout 10 min.
- Unconfirmed: store limits are character counts (App Store 4000, Google Play 500).
- Default sender is `onboarding@resend.dev` (Resend test sender), in a constant.
- Constant names are a contract for #74; keep them plain and exported from the `@/constants` barrel.
- No test runner in this repo (CLAUDE.md); Done check uses typecheck, build and a manual start.

## Steps
1. Code: add dependencies.
   Files: `apps/ai/package.json`, `pnpm-lock.yaml` - Change: `pnpm --filter @training/ai add resend @js-temporal/polyfill`.
2. Code: constants.
   Files: `apps/ai/src/constants/email.ts`, `apps/ai/src/constants/scheduler.ts`, `apps/ai/src/constants/store-limits.ts`, `apps/ai/src/constants/index.ts` - Change: `DEFAULT_EMAIL_FROM`; `SCHEDULER_POLL_INTERVAL_MS`, `SCHEDULER_MAX_ATTEMPTS`, `SCHEDULER_STUCK_JOB_TIMEOUT_MS`; `STORE_LIMITS` (`as const`, `appStore: 4000`, `googlePlay: 500`); export from barrel.
3. Code: config.
   Files: `apps/ai/src/config.ts` - Change: add `resendApiKey: process.env.RESEND_API_KEY` (optional) and `emailFrom: process.env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM`. Treat empty string as unset for the key.
4. Code: env template and docs.
   Files: `apps/ai/.env.example`, `apps/ai/CLAUDE.md` - Change: add `RESEND_API_KEY=` and `EMAIL_FROM=`; one line on the new constants/config.

## Done check
- `pnpm --filter @training/ai typecheck` and `pnpm --filter @training/ai build` exit 0
- Server starts with `RESEND_API_KEY` unset and set to a dummy value (no startup error); do not read or edit `.env*`, pass vars inline
- `.env.example` lists `RESEND_API_KEY` and `EMAIL_FROM`
