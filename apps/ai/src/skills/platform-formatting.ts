export const platformFormatting = {
  name: "platform-formatting",
  description:
    "Supported release formats and the release object the render tool takes. Load when the user names a format for the release notes.",
  content: `# Platform formatting

Code writes the text for every format; you never write per-destination markup. Your job is the release object and the format name. If the user names no format, ask; do not default silently.

## Supported formats
\`markdown\` (GitHub Markdown), \`slack\`, \`app-store\`, \`google-play\`, \`json\`, \`html-email\`. Anything else (for example Discord) is refused by the tool with this list: tell the user the list and ask again. Limits: Slack 35000 characters, App Store 4000, Google Play 500. Over the limit the tool returns an error and no text: tell the user and offer to shorten.

## The release object
- \`openingLine\`: one line summarising the release.
- \`changes\`: every classified entry with a stable \`id\`, one \`type\` (a breaking feature is still a feature), \`breaking\`, a one-sentence \`description\` (past tense, no trailing period, the user's wording for names and identifiers), and \`refs\` copied from the input (omit when none).
- \`version\` and \`date\` (yyyymmdd): set only when the user named them, or when re-rendering. The app computes the version and fills in today's date.

## Rules
- Only use entries that were parsed and classified; never add changes that were not in the input.
- For another format of the same release, copy \`release\` from the previous tool result unchanged and change only \`format\`; the \`hash\` proves it is the same release.
- Do not print the rendered text in chat.
`,
} as const;
