export const platformFormatting = {
  name: "platform-formatting",
  description:
    "Output formatting per destination (Markdown, GitHub release, Slack, plain text). Load when drafting release notes for a named destination.",
  content: `# Platform formatting

Format the draft for the destination the user names. If none is named, ask; do not default silently.

## Common structure
Content only, no title or date line (the tool adds them). Sections in this order: Breaking changes, Features, Fixes, Performance, Docs, Internal, Other. Omit empty sections. Each item is one line: subject in plain language, then the reference (\`#123\`) when known.

## Destinations
- markdown / github: \`##\` section headings, \`-\` bullets, references as \`#123\` so GitHub links them.
- slack: no headings. Bold section names with single asterisks (\`*Features*\`), \`•\` bullets, references as plain text. Keep under 3000 characters; trim Internal first.
- plain text: section names in upper case, \`-\` bullets, no markup.

## Rules
- Only use entries that were parsed and classified; never add changes that were not in the input.
- Keep the user's wording for names and identifiers; fix only obvious typos and tense (past tense, no trailing period).
- Escape characters that break the destination format (\`*\`, \`_\`, \`<\`, \`>\` in Slack).
`,
} as const;
