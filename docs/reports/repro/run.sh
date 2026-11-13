#!/usr/bin/env bash
# Re-runs every check that exists for the GF gap fixes: workspace typecheck/lint/build, then the repro
# scripts kept under docs/bug-reports/. Run from anywhere; it works in the repo root it lives in.
# Each repro prints what it OBSERVES; read the RESULT / true|false lines against docs/reports/code-gap.md.
# Needs `pnpm install` done. No server, database or API key is needed (the repros use fakes).
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"
BUGS="$ROOT/docs/bug-reports"
FAILED=0

step() { printf '\n=== %s\n' "$1"; }
run() { "$@" || { echo "FAILED: $*"; FAILED=1; }; }

step "typecheck (no turbo cache)"; run pnpm exec turbo run typecheck --force
step "lint (no turbo cache)";    run pnpm exec turbo run lint --force
step "build (no turbo cache)";    run pnpm exec turbo run build --force

# Copy a repro into the app (bare imports must resolve there), run it, always delete the copy.
repro() { # <app dir> <repro file> <tsx args...>
  local app="$1" file="$2"; shift 2
  # The web tsconfig only covers src/, so the web copy lives there or JSX gets the classic runtime.
  local dir="$ROOT/apps/$app"; [ "$app" = web ] && dir="$dir/src"
  local tmp="$dir/repro.tmp.${file##*.repro.}"
  step "repro: $file"
  cp "$BUGS/$file" "$tmp"
  ( cd "$ROOT/apps/$app" && env OPENAI_API_KEY=x SUPABASE_URL=http://x SUPABASE_ANON_KEY=x \
      SUPABASE_SERVICE_ROLE_KEY=x DATABASE_URL=postgres://x SRC="$ROOT/apps/ai/src" \
      "$ROOT/apps/ai/node_modules/.bin/tsx" "$@" "${tmp#"$ROOT/apps/$app/"}" ) || { echo "FAILED: $file"; FAILED=1; }
  rm -f "$tmp"
}

repro ai  ticket-117-draft-context-reaches-model.repro.ts
repro ai  ticket-119-120-thread-owner-and-row-lifecycle.repro.ts
repro ai  ticket-122-history-after-restart.repro.ts
repro web ticket-121-thread-placeholder-title.repro.tsx --tsconfig tsconfig.app.json

step "done"
[ "$FAILED" = 0 ] && echo "all steps ran" || { echo "some steps failed (see FAILED lines)"; exit 1; }
