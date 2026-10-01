# Daily report entry

Shared by `gitlab-workflow` and `examples-branch-push`. After the work is pushed (and the MR opened, if any), append one entry to today's report. At the end of the day the user hands that file to another AI to write a progress email, so the entry must stand on its own: someone who never saw the chat should understand what got done and why it matters.

## Where

`docs/daily-report/YYYY-MM-DD.md` (date from `date +%F`). One file per day; every run appends a new entry. Create the folder and the file header if missing:

```markdown
# Daily report YYYY-MM-DD
```

Append with `cat >> file <<'EOF'` so earlier entries are never overwritten. Read the file first if it exists, to avoid duplicating an entry for commits already listed.

## Entry format

Write in English.

```markdown

## HH:MM — <branch>

**Outcome:** <1–2 sentences in plain language: what was delivered and its value. No jargon beyond what a project manager follows.>

**Commits:**
- `<short-hash>` `<commit header>`
- …

**Merge request:** <URL and state, e.g. "awaiting review"> — or "No MR (learning branch, push only)".

**Testing:** <what was actually run, or "not run">

**Issues / next steps:** <blockers, follow-ups, or "None">
```

Get hashes with `git log --oneline -n <count>` for the commits made this run.

## Rules

- **Only what was done.** Report finished, pushed work; don't pad with plans. A skipped or failed step goes under "Issues / next steps", stated honestly.
- **No authorship mentions.** Same as commits and MRs: nothing about Claude, AI, or tools. The report reads as the user's own.
- **Don't commit the report.** It's a local working note for the user's end-of-day email, so leave `docs/daily-report/` out of every `git add`. Write it after the push so it never sits in the tree during staging or rebase. If it keeps showing up in `git status`, tell the user once that adding `docs/daily-report/` to `.gitignore` would silence it. Their call.
- If nothing was committed or pushed this run, don't write an entry.
