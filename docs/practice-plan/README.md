# LangChainJS Practice Plan

Nov 5, 2026

# OVERVIEW

Hands-on practice that follows the LangChain part of the training plan. This plan to rebuild the Release Notes Builder on LangChainJS, then add new features on top. The existing UI is copied over from release-copilot. Everything is due in 7 days, built with Claude Code (see Schedule).

This is a rough plan with quick estimates. Once it is approved, a separate detailed estimate document will list each step of the work (not down to individual lines of code).

The work has two phases:

1. **Migration**: rebuild what release-copilot already delivers, with the same behavior.
2. **New features**: six features added on the migrated app.

Phase 1 adds no features. If behavior changes during migration, we cannot tell whether a difference comes from the framework or from the change.

# OBJECTIVES

* Build the agent with LangChainJS and its prebuilt components, applying the training concepts: tool calling, structured output, dynamic prompts, middleware, human-in-the-loop.
* Keep LLM work (classifying, writing, interpreting requests) separate from deterministic work (rendering, validation, saving, sending).
* Stream responses, tool calls, and approval prompts to the client through AG-UI.

# OUT OF SCOPE

* Submitting directly to the App Store or Google Play.
* Publishing directly to GitHub (users copy the Markdown).
* Roles and multi-team workspaces.
* Custom LangGraph graphs; only createAgent and prebuilt components.

# PHASE 1: MIGRATION

## MIGRATING FROM AND TO

| | From | To |
| :---- | :---- | :---- |
| AI framework | Mastra | LangChain |
| Chat connection | CopilotKit + Mastra server | CopilotKit + AG-UI + separate agent server |
| Storage | LibSQL / Turso | Supabase Postgres |

## FEATURES TO MIGRATE

| Feature | How it migrates |
| :---- | :---- |
| Sign-in (email/password, GitHub) | Same Supabase sign-in; the new app verifies the session itself |
| Paste git log or PR, classify, count-only summary | Same instruction text and rules; parsing and classification rules load when needed |
| Draft for any destination the user names | Same behavior and prompt wording |
| Live Preview and draft card | Same preview tool and UI |
| Automatic title and date | Existing helpers reused |
| Markdown export | Reused as is |
| Slack publish from chat and from History | Same webhook client, same two entry points |
| Release History (save, search, filter, detail) | New table; same API shape so the UI does not change |
| Multiple threads, thread list, generated titles | Rebuilt: client-made thread id, own thread list and title generation |
| Conversation memory | Recent messages kept, older ones summarized |
| Injection and PII guardrails | Rebuilt as middleware |
| Model fallback | Prebuilt middleware |
| Answer-quality checks | Rebuilt with LangChain tooling; not blocking, as today |
| Error and recovery UI | Copied with the UI |

## MIGRATION TIME (3 DAYS)

| Task | Day | Time | Expected result |
| :---- | :---- | :---- | :---- |
| Project setup: create the app, configure the environment and variables, connect the Supabase project | 1 | ¼ day | New app runs and reaches Supabase |
| Early test (spike): build a simple agent and check 3 things we are unsure about: (1) the UI receives streamed data from the agent, including the preview card while it is being created; (2) the agent's confirmation request shows up in the UI; (3) client-made thread ids and generated thread titles | 1 | ½ day | We know the 3 things work, or the fallback is needed |
| Foundation: sign-in, copy the UI; record the parity input set on the old app | 1 | ¼ day | Sign-in works; parity input set exists |
| Agent core: instructions, rules, preview tool, Slack tool, streaming; database and History and Slack endpoints | 2 | 1 day | Paste a log, get a count summary, get a preview card; History and Slack work |
| Threads and memory | 3 | ½ day | Reload a thread and continue |
| Safety and quality: fallback, injection and PII guards, tracing, answer-quality checks | 3 | ¼ day | Bad input is blocked or redacted |
| Parity check: run the input set on the old and new app | 3 | ¼ day | Both apps give matching results |
| **Total** | | **3 days** | **Phase 1 done at the end of day 3** |

# PHASE 2: NEW FEATURES

Order follows dependencies. Multi-format output comes first because preview editing, the changelog, and "ask AI" need its stored structure: today the archive keeps only the text per platform, with no change categories.

## MULTI-FORMAT OUTPUT

One shared JSON schema for a release (version, date, list of changes with a category each). Render from it, without calling the LLM:

* Markdown for GitHub
* HTML email, sent through an email service
* Plain text for App Store and Google Play, within each store's character limit
* JSON for a changelog API

Each output is checked against its limits before it is shown or sent. Archived releases store the schema.

**Done when:** every format renders from the same object; a result that cannot fit its limit shows an error instead of being cut off.

## USER TEMPLATES

Each user saves tone, writing style, and an opening line. The agent applies them to every later generation.

**Done when:** two users with different templates get different tone and openings from the same input; editing a template changes the next generation.

## EDIT DIRECTLY ON THE PREVIEW

Select a sentence, ask for a change in a chat menu, then Accept or Reject (like Copilot in VS Code).

**Done when:** only the selected text changes; Reject changes nothing; a proposal made against an outdated draft is refused.

## SCHEDULED SLACK SEND

The user says "send at 9 AM Monday". The agent sets the time in the user's time zone and asks for confirmation before saving the job. A scheduler sends jobs on time even when the browser is closed.

**Done when:** a job sends with the app closed; each job is sent once; failures are visible with the error; nothing is saved without confirmation.

## APP-WIDE CHANGELOG

A page to browse all past releases with filters (date, change type, version) and pagination. Sends are recorded per release, which also fixes the "Sent" gap.

**Done when:** filters and pagination work on test data; categories match what was stored.

## ASK AI ABOUT THE CHANGELOG

Questions like "what fixes were released in September?" The agent turns the question into a time range and change type, reads the matching records, and summarizes only those. When nothing matches, it says so.

**Done when:** answers use only existing records; an empty result is stated; month boundaries are correct in the user's time zone; one user cannot see another's data.

# SCHEDULE: 7 DAYS

Everything is due in 7 days. A day only ends when that day's "Done when" items pass.

| Day | Work | Day ends with |
| :---- | :---- | :---- |
| 1 | Project setup; spike; foundation; record the parity input set on the old app | Sign-in works; spike result recorded |
| 2 | Agent core (instructions, rules, preview tool, Slack tool, streaming); History and Slack endpoints | Paste a log, get a count summary, get a preview card |
| 3 | Threads and memory; safety and quality; parity check | **Phase 1 done** |
| 4 | Multi-format output | Every format renders from one schema; email sends |
| 5 | Edit directly on the preview; User templates | Accept/Reject works; templates change the output |
| 6 | Scheduled Slack send; App-wide changelog | A scheduled job sends with the app closed; changelog filters work |
| 7 | Ask AI about the changelog; full run-through; fixes | Everything passes its "Done when" |
