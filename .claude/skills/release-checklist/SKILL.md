---
name: release-checklist
description: Run the team release process in a fixed order - verify first, then touch version and tag. Use this whenever the user mentions a release, cutting a release, shipping a version, bumping the version, tagging, release notes, or says "chuẩn bị release", even if they do not ask for a checklist explicitly.
---

# Release checklist

Follow the steps in order. Verification comes before any change to the version or tags, because a bad build must never get a version number. Branch and commit rules live in CLAUDE.md; do not restate them, just obey them.

Stop and wait for the user wherever a step says **STOP**. Releases are hard to undo once pushed.

## 1. Pre-flight
- Run `git branch --show-current` and `git status --short`.
- On `main`: **STOP**. Never release from `main`. Offer to create `chore/release-x.y.z` once the version is known (step 3), and continue from there.
- Dirty working tree: **STOP**. List the changes and ask how to proceed. Unrelated edits would end up in the release.

## 2. Quality gates
Run in this order: `pnpm test`, `pnpm lint`, `pnpm build`. Build is last because type errors only surface there.
- Any failure: **STOP** and report the shortest decisive error line. Fix the code, never edit a test to make it pass. If the test itself looks wrong, ask the user.
- Do not continue to step 3 until all three are green.

## 3. Choose the version
- Find the last tag with `git describe --tags --abbrev=0`. If there is none, use the whole history.
- Read `git log <last-tag>..HEAD --oneline`. Propose the next semver from Conventional Commits: `feat` is minor, `fix` is patch, a `!` or breaking change is major. While the version is `0.x`, say so and let the user decide.
- **STOP** and ask the user to confirm the version. Never choose it silently.

## 4. Release notes
Draft notes from the same log using exactly the template below. A fixed shape makes releases comparable and easy to scan, so do not rename, reorder or restyle the sections.

````markdown
## vX.Y.Z - YYYY-MM-DD

### Highlights
- <one line on the most important change, max 2 lines in total>

### Features
- <scope>: <subject>

### Fixes
- <scope>: <subject>

### Refactors
- <scope>: <subject>

### Docs and chores
- <scope>: <subject>

### Breaking changes
None
````

Rules:
- Map commit types: `feat` to Features, `fix` to Fixes, `refactor` to Refactors, `docs`, `chore` and `test` to Docs and chores.
- Omit a section when it has no entries, except Highlights and Breaking changes, which always stay (write `None` when empty).
- One line per commit, English, lowercase subject copied from the commit, no hashes, no PR numbers. Use `-` as the scope when the commit has none.
- Breaking changes: list each with what changed and how to migrate. A commit with `!` or a `BREAKING CHANGE` footer belongs here.
- The date is today's date in `YYYY-MM-DD`.

Show the notes to the user for approval; do not write them into the repo unless asked.

## 5. Bump the version
Edit `version` in `package.json` only. When the user asks to commit, use one commit with the subject `chore(release): bump version to x.y.z`.

## 6. Tag
Prepare the command `git tag vX.Y.Z` and show it. **STOP.** Create the tag only after the user says so, and never push the branch or tag on your own.

## 7. Final report
Give a short list of every step as done, skipped or blocked, the result of each gate, and the confirmed version. Say plainly what is not done, for example "tag not created".
