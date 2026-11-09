# Ticket 13: [M-10] Day 1 check-in

## What it asks
Chore (no code): confirm the day 1 work is merged (spike doc M-07, web sign-in M-09, env M-01) and list any risk that moves day 2.
Done when: "day 1 ends with sign-in working and spike result recorded."

## What's ambiguous
- "Confirm ... all merged": unclear what counts as proof. A merged PR, or a run showing sign-in works on the current `practices` branch?
- "list any risk that moves day 2": no place or format given for the list (ticket comment, doc, or both).
- "Confirm spike doc, sign-in and env": "env" is not a ticket; assumed to mean M-01 (env, ports, paths, agent id) and the M-02/M-03 config it feeds.

## First step
Check that issues #10 (M-07) and #12 (M-09) are closed and their PRs merged into `practices`, and that `docs/spikes/migration-spike.md` exists with every unknown marked works or fallback.

## Clarifying questions
1. Is a merged-and-closed check enough, or must sign-in (email/password and GitHub) also be re-run on current `practices`?
   Default assumption: re-run sign-in once on current `practices` and record the result. Correct?
   Answer: _(pending)_
2. Where should the check-in result and risk list live?
   Default assumption: a short doc `docs/verification/m-10-day-1-check-in.md`, summarised in a comment on issue #13 by the user (we do not comment). Correct?
   Answer: _(pending)_
3. Should risks be tied to named day 2 tickets (M-11 to M-21), including the tickets the spike gates (M-15, M-20)?
   Default assumption: yes, each risk names the affected ticket and the proposed schedule change. Correct?
   Answer: _(pending)_
