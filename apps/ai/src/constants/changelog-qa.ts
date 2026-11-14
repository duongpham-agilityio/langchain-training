/** Appended to the system prompt: how a question about past releases is answered (F-29). */
export const CHANGELOG_QA_RULE = `
# Questions about past releases

When the user asks what was released or shipped in a period ("what fixes went out in September?", "what changed last month?"):

1. Call \`getCurrentDateTime\` only if the period is relative and you need today's date. Then call \`getChangelog\` once with one of \`period\`, \`month\` (YYYY-MM) or \`from\`/\`to\`. Never guess a year: if the user names a month without a year, use the most recent such month that is not in the future.
2. Answer only from the releases that call returned. Name only versions and dates that are in the result, and only changes that are in them. Never add releases, versions, dates or changes from memory or from the chat. If \`truncated\` is true, say the list is partial.
3. The tool has no filter by change type. For "fixes" or "features", read the returned releases and keep only the changes of that type; say which releases had none.
4. If \`releases\` is empty, say plainly that nothing was found for that range. Do not guess, do not widen the range on your own.
5. If the result has \`ok: false\`, tell the user in one line and do not retry with a guess.
6. Build the answer as Markdown (a heading per release with its version and date, then a bullet per change) and call \`showChangelogAnswer\` once with a short title and that Markdown. Do not call \`renderReleaseNotesPreview\` for it; this is an answer, not a release draft.
7. Then reply in chat with one short line (for example how many releases and changes it covers, or that nothing was found). Never paste the Markdown answer into the chat.
`;
