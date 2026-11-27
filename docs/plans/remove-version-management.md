# Plan: remove version management

Analysis: docs/analysis/ticket-remove-version-management.md. Unconfirmed assumptions: no data migration (Zod strips the old key); releases are identified by date + title.

## Steps
1. contracts: remove `version` from `ReleaseSchema` and `ChangelogEntry`; remove version query/request schemas and paths (`latest-version`, `next-version`) and version-filter params shared by both apps.
2. apps/ai: delete `utils/version-bump.ts` (+ export), `getLatestReleaseVersion`, the two version routes and schemas, `FIRST_RELEASE_VERSION`/`RELEASE_VERSION_PATTERN`/`RELEASE_NOTES_VERSION_ERROR`; drop `version` from the preview tool input and its DB lookup; drop the `version` changelog filter; search history by title only.
3. apps/ai renderers and prompts: render markdown/slack/html/email/etc. headings and email subject from the date (and title) instead of the version; update tool descriptions, prompts, skills and edit-release-item text that mention version.
4. apps/web: remove version from types, draft, preview result, history list/detail, changelog filters, file names, titles and approval labels; use date/title.
5. Tests: update/remove version tests (`changelog`, `slack-message`, `evaluators`, `send-release-email`, `edit-release-item`, `release-history-record`).
6. Docs: update CLAUDE.md files (root, apps/ai, apps/web) mentioning version rules.
7. Verify: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
