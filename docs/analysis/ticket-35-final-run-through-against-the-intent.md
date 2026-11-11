# Ticket 35: [M-32] Final run-through against the intent

## What it asks
Chore / verification. Walk every feature in the migration intent's scope on the unchanged UI, note failures, fix or ticket them.
Done when: every feature in scope works end to end; cut items are named in the PR.

## What's ambiguous
- "Depends on: all above (minus any cut)": M-29 tracing (#32), M-30 answer quality (#33) and M-31 error UI (#34) are still open, so which are "cut" is not stated. The intent's cut line allows cutting quality checks, then tracing; M-31 is not on it.
- "Works end to end" needs live Supabase, OpenAI and Slack credentials; this worktree has none (env files are blocked).
- "Fix or ticket": no threshold for small vs big (same as #24).

## First step
Check which dependencies are merged, run static checks, then walk the scope list live with real env; mark rows UNVERIFIED where the run cannot be done.

## Clarifying questions
Defaults taken, none asked: treat M-29/M-30 as cut only if unmerged when this PR lands; record result in `docs/verification/`.
