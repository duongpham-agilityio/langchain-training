---
name: create-branch
description: Create a correctly named git branch based on the current uncommitted changes. Use this whenever the user asks to create a branch, open a new branch, move the current changes onto a branch, or says "tạo branch", "tạo nhánh", "đặt tên branch", "tôi lỡ code trên main", even if they do not give a branch name.
---

# Create branch from current changes

Read the changes, derive the branch name from them, then switch to the new branch with the changes carried over. This skill is self-contained: it does not depend on any project's CLAUDE.md, so it works in any repo.

Branch name format: `<type>/<short-kebab-description>`, with type one of `feat`, `fix`, `refactor`, `docs`, `test`, `chore`. Work should never be committed directly on `main`, which is why changes made there get moved onto a new branch.

The parent of the new branch is always the branch the user is standing on, whether that is `main`, `develop` or a feature branch. The skill never asks which base to use.

This skill only creates and switches the branch, and records its parent in the local git config. It never commits, pushes, stashes or opens a PR, because the user decides when to do those.

## 1. Inspect
Run `git branch --show-current`, `git status --short` and `git diff HEAD --stat`. Untracked files only show in `status`, so read both.
- No changes at all: **STOP**. Say there is nothing to name a branch after and ask what the branch is for. If the user already gave a name or purpose, create the branch from it and skip to step 4.
- Need more than filenames to judge intent: read `git diff HEAD` for the relevant files.

## 2. Pick the type
Choose the prefix from what the changes do, not from file count:
- `feat`: new behaviour or capability for users
- `fix`: corrects wrong behaviour
- `refactor`: restructures code without changing behaviour
- `docs`: only docs or markdown (including `docs/plans/`)
- `test`: only test files
- `chore`: tooling, config, dependencies, `.claude/`, scripts

When changes mix types, use the one that carries the main intent. If they are truly unrelated (for example a feature plus an unrelated config tweak), say so and suggest splitting into separate branches. **STOP** and let the user choose, since one branch should hold one logical change.

If the user states a type or purpose, that wins over your inference.

## 3. Pick the description
- English, lowercase kebab-case, 2 to 5 words, naming what changes (`login-form-validation`, not `update-stuff`).
- Reuse the ticket name when the user gave one or `docs/plans/<ticket-name>.md` matches the changes.
- No dates, no usernames, no trailing hyphens.

## 4. Check the name
Run `git branch --list '<name>'` for a collision.
- Branch exists: **STOP**, show it and ask whether to switch to it, or use a different name. Never overwrite it.
- Current branch is not `main`/`develop` and already has the same purpose: the changes belong here, so say that and do nothing.
- Otherwise continue. Do not ask which branch to start from: the current branch is the parent.

## 5. Create
Save the parent first: `PARENT=$(git branch --show-current)`. Then run `git switch -c <type>/<description>`. This keeps uncommitted changes in the working tree and moves HEAD, so nothing is lost. If git refuses because of a conflict, report the shortest decisive error line and stop; do not stash or reset to force it.

After the switch, record the parent: `git config branch.<type>/<description>.parent "$PARENT"`. Later steps such as opening a PR can read it with `git config branch.<name>.parent`. If `PARENT` is empty (detached HEAD), skip this and say so in the report.

## 6. Report
Give the final branch name, the type and why you chose it, and where it was checked out from, for example: "Created `chore/verify-before-commit-hook` from `develop`". Mention that nothing was committed or pushed, and that `git branch -m <new-name>` renames it if the name is off. If the user wants a different base, they ask for it afterwards as a separate request.
