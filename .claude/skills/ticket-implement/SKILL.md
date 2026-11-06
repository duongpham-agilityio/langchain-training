---
name: ticket-implement
argument-hint: "<ticket-id | plan-path>"
description: Implement a ticket by handing its plan (docs/plans/) to one general-purpose sub-agent that codes the Steps, runs lint/test/build and a preview, and reports back. Does not commit or push. Use this whenever the user wants to do, implement or execute a ticket after the plan is written, or says "làm ticket", "implement ticket", "thực thi plan", "chạy plan", "code theo plan", "mở sub-agent làm ticket", even if they do not name a plan file.
---

# Ticket implement

Hand a finished plan to one sub-agent and relay its report. Chat output is Vietnamese; files and code are English. The main thread only dispatches and relays: it does not code, and does not re-run test/lint/build.

## 1. Input
A ticket id (`91`, `#91`, `ticket 91`) or a plan path.
- Id: `ls docs/plans/ticket-<id>-*.md` (a plain glob fails in zsh when empty). Use the match; if several, ask the user which one.
- Path: use it if it is under `docs/plans/`.
- No plan found, or neither id nor path given: say so in one Vietnamese line, suggest `ticket-plan`, and stop.

Do not check or switch branches. The worktree is prepared elsewhere.

## 2. Spawn one agent
Read the plan once to confirm it has `Steps` and `Done check`; if not, say so in one line and stop. Then spawn exactly one `general-purpose` sub-agent with the Agent tool, for the whole ticket (never one per Step). Wait for it in the foreground. The prompt must contain the plan path (the agent reads it itself) and the contract below, verbatim:

```
Implement the plan at <plan-path>. Read it and CLAUDE.md first.

Do
- Work the Steps in order. A Test step before its Code step; run the test and see it fail first when the plan says so.
- Touch only the files the Steps name, plus their direct tests/stories. Follow the existing code conventions in CLAUDE.md.
- Unconfirmed assumptions in the plan: use the stated default and list each one in the report.
- When finished, run the plan's "Done check": `pnpm test`, `pnpm lint`, `pnpm build`. If the UI changed, also `preview_start` the `storybook` config (or `dev` for non-UI), read console/logs for errors and take a screenshot.

Deviations
- If a Step cannot be done as written (test fails and cannot be fixed within the Files, code contradicts the plan), you may adjust and go on.
- Every adjustment must be recorded: append a `## Deviations` section at the end of the plan file (create it if missing; never edit the original text above it). Each entry: Step number, what changed, and why.

Never
- git commit, push, open a PR, or create/switch branches.
- Read or edit `.env*` files.
- Add a dependency without a Deviations entry that says why.

Report (final message, English)
- Steps: done / adjusted / not done, one line each.
- Assumptions used.
- Deviations: copy of the section, or `None`.
- Done check: the exit status and the decisive last lines of each command. State plainly any command that failed or was not run, and why.
- Preview: config used, console errors yes/no, screenshot taken yes/no.
- Files changed (from `git status --short`).
```

Do not add commit, push or PR instructions to the prompt. Never paste ticket text or secrets; `.env*` stays unread.

## 3. Reply
Short Vietnamese, from the agent's report only:
- Plan path, Steps done / adjusted / not done.
- Deviations (what and why), or "không có". The user reviews these later, so keep the reason.
- Done check result, quoted from the report. If the agent did not run or failed a check, say so; do not claim success.
- Files changed.
- Next step suggestion: `commit`, then `push-pr`. Suggest only; do not run them.

Do not re-run test/lint/build or inspect the diff yourself. If the agent returned no usable report, say so and stop.
