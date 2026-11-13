# Ticket 119 + 120: [GF-13] Threads belong to their owner, [GF-14] Thread row lifecycle on the server

## What it asks
Bug (security, priority high), two issues in one change.
- #119: any signed-in user holding a thread id can read and continue that thread. Pass `identifyUser` to `CopilotRuntime`, refuse a run in `ReleaseNotesAguiAgent.run` when the thread row belongs to someone else, and protect the first turn by creating the owner row at run start.
- #120: `threads.updated_at` is never updated and a failed title call leaves no row. Add `touchThread`, create the row at run start with an empty title, let the title step fill it (`update ... where title = ''`).
Done when (#119): a second signed-in user who opens `/?thread=<first user's id>` gets an error or an empty thread and cannot continue it; the first user is unaffected.
Done when (#120): using an old thread moves it to the top and into "Today"; a failed title call leaves a titled-later row, not a missing one.

## What's ambiguous
- #119 scope (3): "create the owner row at run start (title filled in later)" vs #120: "proposed: no row for a blocked first turn". The two conflict for a guard-blocked first turn.
- "after every completed turn" (#120): is an approval interrupt a completed turn?
- Does the list show rows with an empty title?

## First step
Add the db helpers in `apps/ai/src/db/threads.ts` (owner lookup, claim, touch, title fill).

## Clarifying questions
1. Should a guard-blocked first turn create a thread row?
   Default assumption: No. The row is claimed after the guard passes (ownership is still checked before the guard). Correct?
   Answer: _(pending)_
2. Does a turn that ends in an approval interrupt bump `updated_at`?
   Default assumption: Yes (the user used the thread); a guard-blocked turn does not. Correct?
   Answer: _(pending)_
3. Should the thread list show a row whose title is still empty?
   Default assumption: Yes. The web already falls back to the thread id (`ThreadListItem`) and treats an empty title as pending (#121 owns the web side). Correct?
   Answer: _(pending)_
