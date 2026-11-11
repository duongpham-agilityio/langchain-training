# Intent: New Features (Epic, Phase 2)

Source: [practice plan](../practice-plan/README.md), Phase 2. Builds on the finished [migration](migration.md).

## Why

Add six features on top of the migrated LangChainJS app. They exercise the training concepts further: structured output, dynamic prompts, long-term memory, human-in-the-loop, and agent tools that read data. LLM work (classify, write, interpret requests) stays separate from deterministic work (render, validate, save, send, schedule).

## Where Phase 1 left things

Facts from the code that the decisions below change:

- The agent writes one free-text `content` per destination; there is no list of changes. Any destination name is accepted.
- The LLM picks the `version` from conversation context.
- A release reaches the database only when the user presses Archive: one row per destination draft, `entries` always empty.
- The classification skill has seven classes: breaking, feature, fix, performance, docs, internal, other.
- The default release date uses a fixed time zone (`America/New_York`).
- Human-in-the-loop exists for one tool: Slack publish.

## Decisions

### Shared by every feature

- **Deadline:** keep all six features. If day 7 ends before they are done, accept the delay; there is no cut order.
- **The agent writes a release object, not finished text.** The object holds `version`, `date`, an opening line, and a list of changes. Each change has a `type`, a `breaking` flag, one description sentence and optional `refs`. Code turns the object into every format; no LLM call at render time.
- **Change types:** `feature`, `fix`, `performance`, `docs`, `internal`, `other`, plus `breaking: boolean`. Breaking stops being a class of its own, so a breaking feature is still a feature. The classification skill is updated to match.
- **Count summary:** six type lines that add up to Total, plus a separate `Breaking: N` line that is not part of the sum and shows only when N is above 0.
- **Refs:** each change lists where it came from in the pasted input (PR numbers, commit hashes). They exist so code can check that the agent invented nothing. No format shows them, except JSON, which is the object itself.
- **Answer-quality checks** follow the object and stay non-blocking: `grounded_items` checks every ref against the pasted input, and a change with no ref scores low; `draft_structure` stops checking markup (code renders it now) and checks the object instead: at least one change, each description one sentence with no markup, no duplicates, opening line not empty; `count_summary_format` follows the new count summary.
- **Version:** code computes it, not the LLM. Base is the user's most recent saved release; breaking = major, feature = minor, anything else = patch. With no saved release it starts at `1.0.0`. A version the user states in chat wins.
- **Saving:** one row per release, storing the object. Sending to Slack, sending email, or scheduling a send saves the release first if it is not saved yet. The manual Archive button stays.
- **Sends are recorded per release.** A release counts as sent after a successful Slack send (immediate or scheduled) or a successful email. Pending or failed jobs, copy and download do not count.
- **Old data:** releases saved before Phase 2 are deleted (test data only). No backfill, no code path for the old shape.
- **Time zone:** the browser sends its IANA time zone with each request. The default release date, scheduled times and Ask AI date ranges all use it. `America/New_York` remains only as the fallback.

### 1. Multi-format output

- Formats with a renderer: Markdown (GitHub), HTML email, App Store text, Google Play text, JSON, Slack.
- The agent renders only the format the user asks for; the preview does not show every format up front. Asking for another format later re-renders the same object without rewriting the content.
- A destination with no renderer (for example "Discord") is refused with the list of supported formats. The free-form destinations of Phase 1 are dropped.
- Each output is checked against its limit before it is shown or sent (App Store 4000 characters, Google Play 500). Over the limit shows an error, never a cut-off.
- JSON is a format to view, copy and download. No new endpoint.
- Email: **Resend**, at development level (test sender, no verified domain, so it only delivers to the Resend account's own address). Sent only from chat. No email button on History. HTML can also be copied.
- Email recipient: the PII guard redacts email addresses in chat messages before the model reads them, so the address cannot be given in chat. The user asks for the email in chat; the confirmation card has a recipient field (one address, format checked on the client and the server) and shows the content. The address goes from the card straight to the tool: the model never sees it and it is not stored in the thread. It is stored with the send record so the release detail can show who received it. The PII guard stays as it is.

### 2. User templates (long-term memory)

- There is no settings form. Templates are long-term memory that the agent saves on its own.
- One record per user with three fixed fields: tone, writing style, opening line. A new value overwrites the old one.
- Stored in the LangGraph Postgres store (already in the installed checkpoint package), with one namespace per user id. No table of our own.
- The agent saves only when the user states a lasting preference ("from now on, always..."). A one-off edit request is not saved. After saving, the agent says so in one line.
- Viewing, changing and clearing the memory all happen in chat.
- The saved values are read per user and applied to every later generation through the dynamic prompt.

### 3. Edit directly on the preview

- Every rendered item (opening line, each change) carries the id of its property in the release object.
- The user selects text and types a request. The client sends an ordinary chat message built from a fixed prompt: the selected item, the current release object, and the request. No separate endpoint.
- The agent calls an edit tool gated by human-in-the-loop, like Slack: a card shows the old and new sentence with Accept and Reject. Accept produces a new draft with only that item changed; Reject changes nothing.
- The message carries a hash of the draft it was made against. The tool refuses when the current draft no longer matches.
- Editing changes the description only, not `type` or `breaking`, so the version does not change.

### 4. Scheduled Slack send

- Jobs live in Postgres. A poller inside the agent server (`apps/ai`) claims due jobs and sends them with the existing webhook client. "App closed" means the browser is closed; the agent server must be running.
- **Time handling:** the job stores `run_at` as an absolute instant (`timestamptz`, UTC) and the user's IANA `time_zone`. The poller only compares `run_at <= now()`; it never looks at the time zone, and the server's own time zone plays no part. The time zone is used twice only: once to convert the user's local time to `run_at` when scheduling, and again to show the time back to the user.
- The agent turns "9 AM Monday" into a local date-time plus the browser's time zone, as structured data. Code, not the LLM, converts it to UTC with a date library. A local time that does not exist or is ambiguous (daylight-saving change) or is already in the past is refused, and the agent asks again. An unknown time zone name is refused.
- The agent asks for confirmation before saving the job. The card shows the time in the user's time zone with the zone name (for example "7:00 PM, 11/11/2026 (Asia/Ho_Chi_Minh)").
- A job stores a snapshot of the content the user confirmed. Later edits to the draft do not change it; to change it, cancel and schedule again.
- On failure: retry a few times, then mark the job failed and store the error. A job is sent at most once: the poller claims a job atomically (`for update skip locked`), so two server instances never take the same job.
- A job stuck in `sending` (server died mid-send) is marked failed after a timeout and is never sent again, to keep the at-most-once rule. This case is my addition, not discussed yet.
- The release detail lists its sends: sent, pending, failed with the error. A pending job can be cancelled. No separate page and no editing of the time.

### 5. App-wide changelog

- A new, read-only page: all saved releases as a timeline of changes by version, each with a Sent / Not sent label.
- Filters: date and version, with pagination. Change type is not a filter (deviation from the plan README).
- History stays as it is: the place to work with one release (detail, send to Slack, see and cancel jobs). The two pages show the same releases on purpose.

### 6. Ask AI about the changelog

- Asked in the existing chat; the agent uses a read-only changelog tool.
- The tool filters by time range only, in the user's time zone, over all saved releases, and marks which ones were sent. Change type is not a tool filter (deviation from the plan README); the agent may still pick out fixes or features from the records it read.
- The answer is built as Markdown and shown in the Live Preview panel.
- The agent summarizes only the records it read. An empty result is stated. One user never sees another's data.

## Changes to Phase 1 behavior

Phase 2 knowingly changes these: free-form destinations become a fixed list; the draft tool takes a release object instead of text; version comes from code; saving is per release and can happen automatically on send; the default date follows the browser time zone.

## Out of scope

- Everything out of scope in the plan README.
- A settings screen for templates.
- A public or authenticated changelog API.
- Email from History; a verified email domain.
- A page listing all scheduled jobs; editing a job's time.
- Rendering the Ask AI answer as an HTML artifact (planned later).
- Marking a release as sent by hand.

## Done when

Each feature meets the "Done when" in the plan README, with these differences:

- Multi-format: the requested format renders from the stored object; the same object renders every supported format on request.
- Templates: the two users' preferences are given in chat, not in a form.
- Changelog and Ask AI: no change-type filter.

## Order and risks

- Multi-format goes first: preview editing, the changelog and Ask AI all need the stored object.
- Changing the draft tool from text to an object touches the preview card, Live Preview, Slack publish and History that Phase 1 delivered; expect rework there.
- Days 4 to 7 are tight for six features; with no cut rule, expect schedule slip.
- Email can only be proven against the Resend account's own address.
