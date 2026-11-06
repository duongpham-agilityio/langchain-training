# Intent: New Features (Epic, Phase 2)

Source: [practice plan](../practice-plan/README.md), Phase 2. Depends on [migration](migration.md) being done.

## Why

Add six features on top of the migrated LangChainJS app. They exercise the training concepts further: structured output, dynamic prompts, human-in-the-loop, and agent tools that read data. LLM work (classify, write, interpret requests) stays separate from deterministic work (render, validate, save, send, schedule).

## Decisions

- **Deadline:** keep all six features. If day 7 ends before they are done, accept the delay; there is no cut order.
- **Release schema** (shared by every feature): `version`, `date`, and a list of changes. Each change keeps the `type` and `breaking` fields the Phase 1 classifier already produces (feat/fix/chore or a team-specific label, per the project's classification rules). Categories are not defined per user.
- **Version:** the agent assigns it as semver from the user's previous version: breaking = major, feat = minor, anything else = patch. The rule is deterministic code, not LLM guessing.
- **Archive:** releases store the schema.

### 1. Multi-format output

- Markdown, HTML email, plain text for App Store / Google Play, JSON. All render from the schema without calling the LLM.
- Each output is checked against its limits before it is shown or sent; over the limit shows an error, never a cut-off.
- Email service: **Resend**. The user gives the recipient list each time and confirms before sending (human-in-the-loop).

### 2. User templates

- One template per user (tone, writing style, opening line), applied to every destination through the dynamic prompt.

### 3. Edit directly on the preview

- Lives in the Live Preview panel: select a sentence, ask for a change in a chat menu, then Accept or Reject.
- A proposal made against an outdated draft is detected with a draft version/hash, checked on the server when Accept is pressed; stale proposals are refused.

### 4. Scheduled Slack send

- Scheduler: pg_cron or a Supabase scheduled function; jobs live in Postgres, so sending works with the browser closed.
- Time zone comes from the browser (IANA name) on each request and is stored in the job.
- The agent asks for confirmation before saving a job.
- On failure: retry a few times, then mark the job failed and store the error, visible in the UI. A job is sent at most once.

### 5. App-wide changelog

- Shows only releases sent to at least one destination (this also fixes the "Sent" gap).
- Filters: date and version, with pagination. Change type is not a filter (deviation from the plan README).

### 6. Ask AI about the changelog

- Asked in the existing chat; the agent uses a read-only changelog tool.
- The agent turns the question into a time range (in the user's time zone), reads matching records, and summarizes only those. Empty result is stated. One user never sees another's data. Change type is not used (deviation from the plan README).

## Done when

Each feature meets the "Done when" in the plan README, except where the decisions above differ (no change-type filter).

## Open questions

- **Releases saved before day 4** (text per platform only, no schema; only test data since Phase 1 starts empty): backfill, ignore, or show with limits. Deferred until Phase 1 is finished.

## Order and risks

Multi-format goes first because preview editing, the changelog, and Ask AI need the stored schema. Days 4 to 7 are tight for six features; with no cut rule, expect schedule slip.
