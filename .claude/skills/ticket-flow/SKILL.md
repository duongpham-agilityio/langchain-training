---
name: ticket-flow
argument-hint: "<ticket-id | description>"
description: Run a ticket from start to a pull request in one go - isolated worktree, branch, analysis (or bug report), plan, implementation, commit, push and PR. Chains the existing ticket-analysis, bug-repro-report, ticket-plan, ticket-implement, commit and push-pr skills. Use this whenever the user wants a ticket done end to end, or says "ticket flow", "làm ticket từ đầu đến cuối", "chạy cả workflow", "từ ticket ra PR", "làm ticket 42 rồi tạo PR", even if they only give a ticket id or a one-line description.
---

# Ticket flow

Run these skills in order, each with the Skill tool. Stop if a stage reports `STOP` or fails.

1. Get the ticket (see "Management tools" in `CLAUDE.md`).
2. Create an isolated worktree and branch (`create-branch`), then work inside it.
3. Analyse: `bug-repro-report` for a bug, otherwise `ticket-analysis`.
4. `ticket-plan`
5. `ticket-implement`
6. `commit auto`
7. `push-pr auto`
