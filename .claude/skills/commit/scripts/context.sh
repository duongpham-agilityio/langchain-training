#!/usr/bin/env bash
# Prints a compact snapshot of the repo state for the commit skill.
set -u

branch=$(git branch --show-current 2>/dev/null)
echo "branch: ${branch:-<detached>}"
case "$branch" in
  main|master) echo "protected: yes (do not commit here)" ;;
  *) echo "protected: no" ;;
esac

status=$(git status --short 2>/dev/null)
if [ -z "$status" ]; then
  echo "changes: none"
  exit 0
fi

echo "changes:"
echo "$status" | head -50
total=$(echo "$status" | wc -l | tr -d ' ')
[ "$total" -gt 50 ] && echo "... ($total files total)"

echo "diffstat:"
git diff HEAD --stat 2>/dev/null | tail -20

# Paths that look like secrets; untracked files are included via status.
secrets=$(echo "$status" | sed 's/^...//' | grep -E '(^|/)\.env|\.(pem|key|p12)$|id_rsa|credentials|secret' || true)
if [ -n "$secrets" ]; then
  echo "secret-like paths (do not stage):"
  echo "$secrets"
else
  echo "secret-like paths: none"
fi
