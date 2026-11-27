# Ticket: Remove version management, focus on building releases

## What it asks
Source (Vietnamese): "Theo yêu cầu mới sẽ loại bỏ việc quản lý version, chỉ còn tập trung vào build. release thôi". Refactor: the app no longer manages release versions; it only builds release notes.
Done when: not stated.

## What's ambiguous
- "Remove version management" could mean dropping auto-bump only, or the `version` field everywhere.

## First step
Drop `version` from the shared `ReleaseSchema` in `packages/contracts`, then follow the typecheck errors.

## Clarifying questions
1. How far does the removal go?
   Default assumption: remove the field entirely.
   Answer: Remove the `version` field entirely (confirmed by the user in chat).
2. What happens to releases already stored with a `version` inside the JSON `release` column?
   Default assumption: no migration; the schema strips the unknown key on read, old rows stay readable.
   Answer: _(pending)_
3. What identifies a release in the UI, the email subject and file names without a version?
   Default assumption: the date plus the opening line (title).
   Answer: _(pending)_
