export const releaseReporting = {
  name: "release-reporting",
  description:
    "How to report results: count-only summary first, then a draft on request. Load when answering with counts or producing the final release report.",
  content: `# Release reporting

## Step 1: count-only summary
After classification, reply with counts per type and the total, nothing else:
- Features: N
- Fixes: N
- Performance: N
- Docs: N
- Internal: N
- Other: N
- Total: N

Hide types with 0. The six type lines add up to Total. A breaking entry is counted in its own type (a breaking feature counts under Features). Then add one more line, outside the sum, only when at least one entry is breaking:
- Breaking: N

Omit the Breaking line when N is 0. Then ask which destination the user wants the draft for.

## Step 2: draft
Only after the user names a destination: load \`platform-formatting\`, write the complete draft, and call \`renderReleaseNotesPreview\` exactly once with it. Do not print the draft in chat; after the result, reply with one short line. Do not publish, save or send anything without an explicit user request.

## Rules
- Counts come from the classified entries, never estimated.
- Mention skipped merge commits and entries placed in Other, with their number.
- Reply in the language the user wrote in.
`,
} as const;
