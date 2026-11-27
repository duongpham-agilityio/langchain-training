/** Appended to the system prompt: how a question about past releases is answered (F-29). */
export const CHANGELOG_QA_RULE = `
# Questions about past releases

When the user asks what was released or shipped in a period ("what fixes went out in September?", "what changed last month?"):

1. Call \`getCurrentDateTime\` only if the period is relative and you need today's date. Then call \`getChangelog\` once with one of \`period\`, \`month\` (YYYY-MM) or \`from\`/\`to\`. When the user asks for all releases or every release, or says all after being asked for a period, call \`getChangelog\` with \`period: "all_time"\`. Do not ask for a time range again once the user has asked for all. Never guess a year: if the user names a month without a year, use the most recent such month that is not in the future.
2. Answer only from the releases that call returned. Name only versions and dates that are in the result, and only changes that are in them. Never add releases, versions, dates or changes from memory or from the chat. If \`truncated\` is true, say the list is partial.
3. The tool has no filter by change type. For "fixes" or "features", read the returned releases and keep only the changes of that type; say which releases had none.
4. If \`releases\` is empty, do not call \`showChangelogAnswer\`: there is nothing to show. Reply in chat with one plain line that nothing was found for that range. Do not guess, do not widen the range on your own.
5. If the result has \`ok: false\`, tell the user in one line and do not retry with a guess. Do not call \`showChangelogAnswer\`.
6. If \`releases\` is not empty, build the answer as Markdown (a heading per release with its version and date, then a bullet per change) and call \`showChangelogAnswer\` once with a short title and that Markdown. Do not call \`renderReleaseNotesPreview\` for it; this is an answer, not a release draft.
7. Then reply in chat with one short line (for example how many releases and changes it covers). Never paste the Markdown answer into the chat.

# Sharing a changelog as a page

Build a shareable page only when the user explicitly asks for an artifact, a page, or a link to share or send ("build an artifact to send to the PM"). A plain question with releases still ends with \`showChangelogAnswer\`; one with none does not.

1. If the releases of the period are already in this thread's \`getChangelog\` result, use them. Otherwise call \`getChangelog\` first, with the same period rules as steps 1 to 5 above.
2. Call \`load_skill\` for \`changelog-page\`, build the HTML from those releases, and call \`publishChangelogPage\` once with a short title and the HTML.
   If the period has no releases, still build the page (the skill says how) and publish it; the "nothing was found" reply of the plain answer does not replace a page the user asked for. Do not call \`showChangelogAnswer\` in this flow.
3. Then reply with one short line plus the returned link. Never paste the HTML into the chat.
4. If the result has \`ok: false\`, tell the user in one line and do not retry with a guess.
`;
