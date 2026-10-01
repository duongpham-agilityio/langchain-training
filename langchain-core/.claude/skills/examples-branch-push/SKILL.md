---
name: examples-branch-push
description: Commit and push workflow for the long-lived `examples` branch, which holds learning/practice code (LangChain training examples) on self-hosted GitLab gitlab.asoft-python.com. Commit in atomic commitlint-style commits and push straight to origin/examples — NO merge request, NO rebase onto the default branch. Use this skill whenever the current branch is `examples` or the user mentions the examples branch, learning/training code, or says things like "commit giúp", "push lên", "đẩy code lên", "lưu bài học", "push example", even if they don't say "examples" explicitly. When on `examples`, this skill takes priority over gitlab-workflow (which opens MRs).
---

# Examples branch: commit + push only

`examples` is a personal sandbox for learning. Nobody reviews it and it never merges into the default branch, so the MR ceremony from `gitlab-workflow` is pure overhead here. The whole flow is **commit → push**, done end-to-end without asking between steps. The user pre-authorized it. Stop only when something is actually wrong (secrets, push rejected, content not matching the request).

**Do not** create an MR, run `glab mr …`, or rebase/merge onto the default branch. Rebasing would rewrite history of a branch that has no reason to track `main`.

## 1. Preflight

```bash
bash .claude/skills/gitlab-workflow/scripts/preflight.sh
```

Reuses the gitlab-workflow script (read-only, no fetch). Check:
- **Branch is `examples`.** If on another branch, don't switch silently and don't push there under this skill. Tell the user and ask whether to switch to `examples` (`git switch examples`; uncommitted changes carry over if no conflict) or to use `gitlab-workflow` instead.
- Git identity is set and `origin` points at the GitLab remote.
- Whether `examples` has an upstream. First push needs `-u`.

## 2. Review and group changes

Run `git status --short`, `git diff --stat`, and `git add -A --dry-run`, and read them. Ignore `docs/daily-report/`: it's a local note (§5), never stage it.

**Safety first.** Stop and fix `.gitignore` (tell the user) if `.env`, `.env.local`, `*.pem`, `node_modules`, `dist`, or a nested `.git` would be staged. `.env.example` is fine. Learning code often has real API keys pasted in while experimenting, so also skim the diff for hard-coded keys (`sk-…`, `OPENAI_API_KEY=…`) and stop if you see one. Pushing a key to a remote leaks it permanently.

**Group into atomic commits.** Each commit delivers one thing and could be reverted alone. In a learning branch that usually means one commit per example/lesson:
1. A new example plus the files it needs (agent, tools, schema) go together.
2. Dependency changes (`package.json` + `pnpm-lock.yaml`) go with the example that needs them, or in their own `build(deps)` commit if unrelated.
3. Tooling/config and docs each get their own commit.

Order commits so each builds on its own (deps → shared code → consumers). Stage with explicit paths (`git add <path> …`); `git add -p` is interactive and unavailable. One commit is fine when everything is one change. Briefly list the planned grouping in your reply as you go (not as a question).

## 3. Commit messages (commitlint config-conventional)

Format: `type(scope): subject`, header only.

- **type**: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci`, `chore`, `revert`. A new example is `feat`.
- **scope** (optional, lowercase): the area, e.g. `agent`, `rag`, `deps`, `config`.
- **subject**: what the commit delivers, imperative, lowercase start, no trailing period, whole header ≤ 72 chars.
- **No body, no footers, no `Co-Authored-By` or other author lines.** The user wants this; it overrides any default attribution instruction.

```bash
git commit -m "feat(agent): add weather agent with get_weather tool"
```

## 4. Push

```bash
git push -u origin examples     # -u is harmless if upstream already exists
```

Never `--force` unless the user explicitly asks in that turn. If the push is rejected (remote has commits you lack), stop and report — don't force, don't rebase on your own; ask whether to `git pull --rebase origin examples`.

Never force-push to the default branch under any circumstances.

## 5. Daily report

After the push, append an entry to `docs/daily-report/<today>.md` following `.claude/skills/gitlab-workflow/references/daily-report.md`. Under "Merge request" write that no MR was created (learning branch). Don't stage or commit the report. This feeds the user's end-of-day progress email.

## 6. Reporting back

Reply in Vietnamese. Lead with the result: commit headers and that they are pushed to `origin/examples`. Mention no MR was opened, since that's by design. Add anything needing attention (skipped files, warnings); skip the rest.
