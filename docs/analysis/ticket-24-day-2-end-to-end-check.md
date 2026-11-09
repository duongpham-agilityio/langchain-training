# Ticket 24: [M-21] Day 2 end-to-end check

## What it asks
Chore / verification. Run the whole Day 2 flow by hand on the unchanged UI: sign in, paste a log, count summary, preview card, save to History, publish to Slack from chat and from History. Fix small gaps found; log bigger ones as new tickets.
Done when: "the whole run passes on the unchanged UI."

## What's ambiguous
- "Fix small gaps; log bigger ones as new tickets": no threshold for small vs big. Two developers would draw the line differently.
- "Depends on: M-16, M-18, M-20": GitHub issue numbers differ from M-ids (this is #24 = M-21), so merge state of the dependencies on the base branch is not stated. Slack publish (M-22/M-23 analysis docs are tickets 22/23) and History endpoints (ticket 21) are exercised by the run but not listed as dependencies.
- "publish to Slack ... from History": a real Slack webhook is needed; the ticket does not say whether to use a real test channel or a stub.
- "Pass" evidence is not defined (notes, screenshots, a checklist in the PR).

## First step
Check that the app runs locally (`pnpm dev`: agent server + web, Supabase and Slack env set from the `.env.example` files) and that the dependency work is on the base branch; then walk the flow once and record each step as pass/fail.

## Clarifying questions
1. What counts as a "small gap" to fix in this ticket?
   Default assumption: a fix of roughly a few lines in one or two files with no schema, API-shape or UI-layout change; anything bigger becomes a new GitHub issue. Correct?
   Answer: _(pending)_
2. Should the Slack publish step post to a real test channel webhook?
   Default assumption: yes, to a throwaway test channel via `SLACK_WEBHOOK_URL` set locally; the URL is never committed. Correct?
   Answer: _(pending)_
3. Where is the run result recorded?
   Default assumption: a verification note in `docs/verification/` plus the PR description with the pass/fail checklist and links to any new issues. Correct?
   Answer: _(pending)_
