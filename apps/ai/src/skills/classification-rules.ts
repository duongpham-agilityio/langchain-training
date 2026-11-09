export const classificationRules = {
  name: "classification-rules",
  description:
    "Rules to classify each change entry (feature, fix, breaking, ...). Load after parsing a git log or PR list, before counting or drafting.",
  content: `# Classification rules

Give every parsed entry exactly one class.

## Classes (check in this order)
1. breaking: \`!\` after the type (\`feat!:\`), a \`BREAKING CHANGE:\` note, or wording like "removes", "drops support".
2. feature: \`feat\` or a new user-visible capability.
3. fix: \`fix\` or a bug, crash or regression correction.
4. performance: \`perf\` or a stated speed/memory improvement.
5. docs: \`docs\` or documentation-only change.
6. internal: \`chore\`, \`refactor\`, \`test\`, \`build\`, \`ci\`, \`style\`, dependency bumps.
7. other: nothing above fits; never force a guess.

## Rules
- Conventional Commit prefix wins when present. Scopes (\`feat(auth):\`) do not change the class.
- Without a prefix, classify from the subject wording ("Add" -> feature, "Fix" -> fix, "Bump" -> internal).
- Revert commits take the class of the change they revert unless the subject says otherwise; note it as a revert.
- One entry, one class. Counts per class must add up to the entry total.
- Low-confidence entries go to other and are listed so the user can correct them.
`,
} as const;
