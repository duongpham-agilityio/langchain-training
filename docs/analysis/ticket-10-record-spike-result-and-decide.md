# Ticket 10: [M-07] Record spike result and decide

## What it asks
Task (docs + cleanup): write one short doc `docs/spikes/migration-spike.md` that, for spikes A (M-04), B (M-05) and C (M-06), says works / needs fallback, how, and what it changes in M-15, M-20, M-22, M-24. Delete or isolate the throwaway spike code.
Done when: "doc exists and every unknown is marked works or fallback; no throwaway code left on the main path."

## What's ambiguous
- "Delete or isolate throwaway spike code": spike code sits in `apps/ai/src/spikes/*`, `apps/web/src/spikes/*`, `apps/web/*-spike.html` and a `spike:hitl` script in `apps/ai/package.json`. Not stated which of the two to do.
- Ticket ids in the three spike docs do not match the issue titles: the M-05 doc says "use path A for M-07 onward" and lists "M-07" as a consumer, while M-07 is this doc. The per-spike impact lists also disagree on what M-15/M-20/M-22/M-24 are (e.g. M-05 doc calls M-22 the Slack confirmation, but in the ticket list M-20 is the Slack tool and M-22 the checkpointer).
- Where the spike docs end up: fold into `migration-spike.md` or keep next to it.

## First step
Read the three spike docs and the M-15, M-20, M-22, M-24 tickets (`docs/tickets/migration-draft.md`), and map each finding to the ticket that really owns it.

## Clarifying questions
1. Delete the throwaway code (recoverable from git history, PRs #40-#42) or move it to an isolated folder?
   Default assumption: delete it, including the `spike:hitl` script and the two `*-spike.html` entries; the three spike docs stay as the record and name the commits. Correct?
   Answer: _(pending)_
2. Keep the three per-spike docs, or replace them with `migration-spike.md`?
   Default assumption: keep them as evidence; `migration-spike.md` is the short decision doc that links to them. Correct?
   Answer: _(pending)_
3. Which ticket numbering wins where the spike docs disagree?
   Default assumption: the ticket list in `docs/tickets/migration-draft.md` (M-15 preview stream, M-20 Slack tool, M-22 checkpointer, M-24 titles). Correct?
   Answer: _(pending)_
