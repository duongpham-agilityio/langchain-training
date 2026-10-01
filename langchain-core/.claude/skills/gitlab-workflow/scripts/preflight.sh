#!/usr/bin/env bash
# Read-only status report for git / glab work. Does not fetch.
# Usage (from repo root): bash .claude/skills/gitlab-workflow/scripts/preflight.sh

section() { printf '\n== %s ==\n' "$1"; }

section "glab"
if command -v glab >/dev/null 2>&1; then
  glab --version | head -1
  glab auth status 2>&1 | grep -E "Logged in|not logged|Git operations|API calls|Token" || echo "auth: unknown"
else
  echo "glab: NOT FOUND (brew install glab)"
fi

section "Git"
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "not a git repository"; exit 0
fi
echo "user.name:  $(git config user.name || echo MISSING)"
echo "user.email: $(git config user.email || echo MISSING)"
echo "branch:     $(git branch --show-current)"
echo "origin:     $(git remote get-url origin 2>/dev/null || echo 'none')"
echo "remote default branch: $(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##' || echo 'unknown (run: git remote set-head origin -a)')"
echo "origin/develop: $(git rev-parse --short origin/develop 2>/dev/null || echo 'not fetched / missing')"
if git rev-parse --abbrev-ref '@{u}' >/dev/null 2>&1; then
  echo "upstream:   $(git rev-parse --abbrev-ref '@{u}') ahead/behind $(git rev-list --left-right --count 'HEAD...@{u}' | tr '\t' '/') (as of last fetch)"
else
  echo "upstream:   none"
fi
echo "last commit: $(git log -1 --oneline 2>/dev/null || echo 'none')"

section "Uncommitted"
git status --short | head -30
if [ "$(git status --porcelain | wc -l)" -gt 30 ]; then echo "... (truncated)"; fi
