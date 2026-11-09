# Ticket 16: [M-13] Port parsing, classification and formatting rules as on-demand skills

## What it asks
Feature. Port four rule sets (`commit-pr-parsing`, `classification-rules`, `platform-formatting`, `release-reporting`) into `src/skills/` so the agent loads them only when needed, not on every turn.
Done when: pasting a git log makes the agent load the parsing and classification rules; a plain greeting loads none.

## What's ambiguous
- "Port ... into `src/skills/`": the old rule text is not in this repo (only named in `docs/tickets/migration-draft.md`).
- "Depends on M-12": M-12 (dynamic prompt middleware) is not on `practices` yet; `SYSTEM_PROMPT` is still a plain string.
- No stated load mechanism (tool vs middleware vs file read).

## First step
Define the skill registry and a `load_skill` tool wrapped in a middleware, independent of M-12.

## Clarifying questions
1. Where is the old rule text to port verbatim?
   Default assumption: not available; skills are written from the ticket names and the app domain (git log / PR text, classes, destinations, count-only summary). Correct?
   Answer: _(pending)_
2. May M-13 land before M-12?
   Default assumption: yes; skills middleware is self-contained (own tool + own prompt append) and does not touch `SYSTEM_PROMPT`. Correct?
   Answer: _(pending)_
