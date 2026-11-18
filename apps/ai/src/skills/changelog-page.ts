export const changelogPage = {
  name: "changelog-page",
  description:
    "Design rules for a shareable changelog web page. Load before building the HTML for publishChangelogPage.",
  content: `# Changelog page

The page is one HTML document that you pass as \`html\` to \`publishChangelogPage\`. It is opened by people who are not signed in, on a phone or a desktop, in a light or a dark theme.

## Document
- A single self-contained document that starts with \`<!doctype html>\`, with \`<meta charset="utf-8">\`, a viewport meta tag and a \`<title>\`.
- inline CSS and JavaScript only. No external scripts, fonts or images: no CDN, no web fonts, no remote images, no \`<link>\` to other files. Use the system font stack. JavaScript is optional; prefer none.
- Content is visible at load. Nothing is hidden behind a script, a tab, an animation or a click to reveal it.

## Theme and layout
- Define colour tokens as custom properties on \`:root\` (background, text, muted text, border, accent) and use only those tokens.
- Redefine the tokens under \`@media (prefers-color-scheme: dark)\`. Set an explicit background on \`body\` so the page never falls back to the browser default.
- Readable at 400px width: a single column with a 16px side gutter, fluid width (max about 720px, centred), no horizontal page scroll. Wrap long words and code (\`overflow-wrap: anywhere\`).
- Body text at least 16px, comfortable line height, sufficient contrast in both themes.

## Structure
1. Title (h1).
2. The period the releases cover (for example "September 2026").
3. One section per release, newest first as returned: heading with the version and the date, then its changes grouped by type (Features, Fixes, Performance, Docs, Internal, Other), one list item per change. Skip a type that has no changes in that release. Mark a breaking change clearly.

## Content
- Only content from the \`getChangelog\` result: its versions, dates and changes. Never add a release, version, date or change from memory or from the chat. Escape text that goes into the HTML (\`&\`, \`<\`, \`>\`).
- If the result has no releases, build a short page that says nothing was found for that period.
- If \`truncated\` was true, say on the page that the list is partial.
`,
} as const;
