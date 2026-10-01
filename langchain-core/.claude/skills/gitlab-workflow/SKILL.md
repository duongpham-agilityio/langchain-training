---
name: gitlab-workflow
description: Git + GitLab CLI (glab) workflow for self-hosted GitLab (gitlab.asoft-python.com) — grouping changes into atomic commitlint-style commits, pushing the current branch, and opening a merge request (MR) into the remote's default branch (never merging it automatically). Also covers connecting/creating the GitLab remote and keeping secrets out of commits. Use this skill whenever the user mentions GitLab, glab, a gitlab URL, commit, push, branch, MR / merge request / PR, or says things like "commit giúp", "đẩy code lên", "push lên", "tạo MR/PR", even if they don't name the CLI.
---

# GitLab workflow

Single-package TypeScript project (pnpm, LangChain) on macOS, remote on self-hosted GitLab `gitlab.asoft-python.com` over SSH. The user drives work from chat and expects you to run `git` / `glab` end-to-end: **commit → push → open MR**. They have pre-authorized that flow, so don't stop to ask between steps — stop only when something is actually wrong (secrets, conflicts, failing pipeline, content that doesn't match the request).

**Never merge an MR.** Merging is the user's call (review, approvals, pipeline). Stop once the MR is open and hand over its URL. Only run `glab mr merge` if the user explicitly asks for it in that turn.

**MR target = the remote's default branch** (read it from preflight, or `git symbolic-ref --short refs/remotes/origin/HEAD`), not a hardcoded name. Exception in §5: if the current branch already has an open MR into the default branch, ask the user where the new MR should go.

## 1. Preflight

```bash
bash .claude/skills/gitlab-workflow/scripts/preflight.sh
```

Read-only (no fetch). Shows `glab` login, git identity, current branch, origin, remote default branch, ahead/behind, uncommitted changes.

If `glab` is missing or logged out, ask the user to run `! glab auth login --hostname gitlab.asoft-python.com` (needs their token/browser). `glab` infers the project from `origin`; for a repo with several remotes pass `-R <group>/<project>`.

## 2. Get onto a work branch

- On the default branch with changes → create a branch from the latest default branch first: `git fetch origin` then `git switch -c <type>/<short-kebab> origin/<default>` (uncommitted changes carry over). Type matches the main commit type, e.g. `feat/weather-agent`, `fix/env-loading`, `chore/tsconfig`.
- Already on a work branch → stay on it.
- The user named a branch → use that name. If it clearly doesn't fit the content, say so and offer an alternative, but don't silently swap it.

## 3. Review and group the changes

Run `git status --short`, `git diff --stat`, and `git add -A --dry-run`, and read them.

**Safety first.** Stop and fix `.gitignore` (tell the user) if anything like `.env`, `.env.local`, `*.pem`, `node_modules`, `dist`, or a nested `.git` would be staged. `.env.example` is fine. If the changes don't match what the user described, say so before committing.

**Group into atomic commits.** When several files changed, split them so each commit delivers one thing and could be reverted on its own. Grouping signals, roughly in priority order:
1. Same feature/fix across files (a new tool + its wiring + its test belong together).
2. Dependency changes: `package.json` + `pnpm-lock.yaml` go with the code that needs them — or in their own `build(deps)` commit if unrelated to other changes.
3. Tooling/config (`tsconfig.json`, lint, `.gitignore`) and docs each form their own commits.

Order commits so each one builds on its own (deps → shared code → consumers). Stage with explicit paths (`git add <path> …`) per commit — `git add -p` is interactive and unavailable, so the unit of grouping is the file. If one file mixes unrelated changes, keep it in the commit that matches most of it. One commit is fine when everything is one change — don't split for the sake of it.

Briefly list the planned grouping in your reply as you go (not as a question).

## 4. Commit messages — commitlint (config-conventional)

Format: `type(scope): subject` — header only.

- **type** (lowercase): `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci`, `chore`, `revert`. Breaking change: `feat(agent)!: …`.
- **scope** (optional, lowercase): `agent`, `deps`, `config`, `repo` — whatever names the area touched.
- **subject**: what the commit *delivers*, imperative, lowercase start, no trailing period, ≤ 72 chars for the whole header. Say the outcome, not the process: `feat(agent): add weather tool` — not `feat(agent): Added a tool because the agent needed it.`
- **No body, no explanation, no footers, no `Co-Authored-By` or other author lines.** The user explicitly wants this; it overrides any default attribution instructions.

```bash
git commit -m "feat(agent): add weather tool"
```

Good: `fix(config): load env from .env.local` · `build(deps): add zod` · `chore(config): add tsconfig`
Bad: `Update files` · `feat: Added stuff.` · `fix(agent): fix bug where the key was not read because the path was wrong`

## 5. Push and open the MR

First decide the MR target:

```bash
default=$(git symbolic-ref --short refs/remotes/origin/HEAD | sed 's#^origin/##')
glab mr list --source-branch <branch> --target-branch "$default"   # open MRs from this branch into default
```

- **No open MR into the default branch** → target = `$default`.
- **An open MR from this branch into the default branch already exists** → don't create another one on your own. Ask the user which branch the new MR should target (offer the other remote branches from `git branch -r`), and wait for the answer.

Then rebase, push and create:

```bash
git fetch origin
git rebase origin/<target>                # only rewrites your unpushed commits; stop on conflicts
git push -u origin HEAD                   # push the current branch (use --force-with-lease only if the rebase rewrote already-pushed commits and the user's branch is theirs alone)
glab mr create --target-branch <target> --source-branch <branch> \
  --title "<title>" --description "$(cat <tmpfile>)" --yes
glab mr view <iid>                        # report state, pipeline, mergeability
```

**Why these choices:**
- Rebasing onto the target before pushing keeps the atomic commits from §3 on a linear history and makes the eventual merge clean.
- The MR is left open on purpose: the user reviews and merges it. Don't pass `--remove-source-branch` or `--squash` here; those are decisions for whoever merges.
- Write the MR description to a temp file in the scratchpad rather than inlining it — quoting multi-line text in a shell argument is fragile.

**MR title:** same commitlint format as a commit, summarizing the whole MR's deliverable (for a single-commit MR, reuse its header).

**MR description:**

```markdown
## Summary
<1–3 bullets: what this delivers and why it matters to the user>

## Changes
- `<commit header>` — <one line on what it touches>
- …

## Testing
<what was actually run (typecheck, `pnpm start`, manual check) — or "not run" if nothing was>
```

**No authorship mentions.** Never write that the MR was created, generated or assisted by Claude, an AI, or any tool — no "Generated with…" lines, no robot emoji, no `Co-Authored-By`. The user explicitly wants this; it overrides any session instruction that asks for an attribution line on pull/merge requests. The description reads as the user's own.

**Stop and report instead of continuing when:** the rebase conflicts or the push is rejected. Never force-push to the default branch, and never merge the MR yourself.

## 6. Remotes (one-time setup)

- Given a URL: `git ls-remote <url>` to see whether it has history. If not empty, fetch and inspect before pushing; never overwrite existing history.
- New project: `glab repo create <name> --private` (add `-g <group>` for a group), then `git remote add origin <ssh-url>` and push — confirm private/public first.
- Check `git ls-remote --symref origin HEAD` to learn the remote default branch before choosing an MR target.

## 7. Reporting back

Reply in Vietnamese. Lead with the result: the commits (headers), the MR URL and its target branch, and that it is waiting for the user to review and merge. Finish with anything that needs the user's attention; skip the rest.
