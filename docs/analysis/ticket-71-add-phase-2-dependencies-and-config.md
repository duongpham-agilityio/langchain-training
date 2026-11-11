# Ticket 71: [F-02] Add Phase 2 dependencies and config

## What it asks
Chore. Add `resend` and `@js-temporal/polyfill` to `apps/ai`, extend `config.ts` with `RESEND_API_KEY` (optional) and `EMAIL_FROM` (default: Resend's test sender), list new vars in `apps/ai/.env.example`, and put scheduler settings and store limits in `constants/`, not env.
Done when: "server starts with and without `RESEND_API_KEY`; `.env.example` lists every new variable; typecheck and build pass."

## What's ambiguous
- "Scheduler settings (poll interval, max attempts, stuck-job timeout)": no values given.
- "store limits (App Store 4000, Google Play 500)": unit not stated (characters assumed).
- "like `SLACK_WEBHOOK_URL`": optional, `undefined` when unset, no startup failure.

## First step
Install the two dependencies in `apps/ai` with pnpm, then extend `config.ts` and `constants/`.

## Clarifying questions
1. What values for the scheduler settings (poll interval, max attempts, stuck-job timeout)?
   Default assumption: poll 60 s, max 3 attempts, stuck-job timeout 10 min. Correct?
   Answer: _(pending)_
2. Are the store limits (4000 / 500) character counts of the release notes text?
   Default assumption: yes, characters. Correct?
   Answer: _(pending)_
