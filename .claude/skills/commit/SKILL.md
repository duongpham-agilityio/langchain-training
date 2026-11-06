---
name: commit
argument-hint: "[auto|manual]"
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/context.sh:*) Bash(git status:*) Bash(git diff:*) Bash(git log:*) Bash(git branch --show-current) Bash(git add:*) Bash(git commit -m:*)
description: Create clean git commits from the current changes, one logical change per commit, with Conventional Commit messages. Supports two modes - auto (commit straight away, then log the result) and manual (show the planned commits and ask for approval first). Use this whenever the user asks to commit, commit changes, make a commit, or says "commit", "commit changes", "commit auto", "commit manual", "tạo commit", "lưu thay đổi", "commit giúp tôi", "commit code", even if they give no message or mode.
---

# Commit

Follow the steps in order. This skill only commits locally: it never pushes, amends or rewrites history unless the user explicitly asks for that in the same turn.

## Modes
- **auto**: commit without asking, then log what was created. Pick it when the user says "auto", "tự động", or "just commit it".
- **manual** (default): show the planned commits and wait for approval before committing. Pick it when the user says "manual", "cho tôi duyệt", or names no mode, because a commit is easy to get wrong silently and cheap to review first.

The mode can also come as the slash-command argument (`/commit auto`, `/commit manual`); an argument wins over wording in the prompt. State the chosen mode in one line before step 1.

## 1. Inspect
Repo snapshot, collected when this skill loaded:

!`${CLAUDE_SKILL_DIR}/scripts/context.sh`

- If the snapshot above is missing or looks stale, run `${CLAUDE_SKILL_DIR}/scripts/context.sh` yourself.
- Read the actual diff (`git diff HEAD -- <path>`) wherever the intent of a change is unclear. A message written from file names alone is usually wrong.
- `changes: none`: **STOP** and say there is nothing to commit.

## 2. Check the branch
- `protected: yes` (`main` or `master`): **STOP**, in both modes. Never commit directly to a base branch. Suggest creating a branch first (use the `create-branch` skill if available), then resume here.

## 3. Group the changes
One logical change per commit keeps history easy to review and revert.
- If the diff mixes unrelated changes (feature plus docs fix plus config tweak), split it into several commits, each with its own paths.
- Stage only explicit paths: `git add <path> ...`. Never `git add -A` or `git add .`, they sweep in unrelated or sensitive files.
- One file holding two unrelated changes stays in one commit; mention it in the plan.
- Never stage `.env*`, keys, tokens or credentials. If the snapshot lists secret-like paths, or the diff shows a secret, **STOP** in both modes and warn the user without printing their contents.

## 4. Write the messages
Format: `type(scope): subject`
- Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`.
- Scope: area touched, lowercase kebab-case; omit the parentheses if unclear.
- Subject: English, imperative, lowercase, no trailing period, ideally under 72 characters.
- Subject line only: no body, no footer. Never add `Co-Authored-By` or any attribution trailer.

Example: `feat(login): add password validation`

## 5. Commit
Build the plan: each commit as message plus file list, in order.
- **manual**: show the plan, ask "Approve?", then **STOP**. Commit only after a clear yes. If the user edits a message or the grouping, update the plan and show it again.
- **auto**: show the plan briefly and commit immediately, no question.

Commit each in order with `git add <paths>` then `git commit -m "<subject>"`. If a hook fails, report the shortest decisive error line, fix the cause and make a new commit. Never use `--no-verify`, never amend.

## 6. Log the result
Run `git log --oneline -n <count>` and report:
- each commit as `<short-hash> <subject>`
- anything left uncommitted (`git status --short`) and why
- that nothing was pushed
