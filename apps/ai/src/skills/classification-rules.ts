export const classificationRules = {
  name: "classification-rules",
  description:
    "Rules to type each change entry (feature, fix, ...) plus a breaking flag. Load after parsing a git log or PR list, before counting or drafting.",
  content: `# Classification rules

Give every parsed entry exactly one type and a breaking flag.

## Types (check in this order)
1. feature: \`feat\` or a new user-visible capability.
2. fix: \`fix\` or a bug, crash or regression correction.
3. performance: \`perf\` or a stated speed/memory improvement.
4. docs: \`docs\` or documentation-only change.
5. internal: \`chore\`, \`refactor\`, \`test\`, \`build\`, \`ci\`, \`style\`, dependency bumps.
6. other: nothing above fits; never force a guess.

## Breaking flag
Breaking is a flag on the entry, not a type. Set \`breaking: true\` for \`!\` after the type (\`feat!:\`), a \`BREAKING CHANGE:\` note, or wording like "removes", "drops support". The entry keeps its type: a breaking feature is still a feature.

## Rules
- Conventional Commit prefix wins when present. Scopes (\`feat(auth):\`) do not change the type.
- Without a prefix, pick the type from the subject wording ("Add" -> feature, "Fix" -> fix, "Bump" -> internal).
- Revert commits take the type of the change they revert unless the subject says otherwise; note it as a revert.
- One entry, one type. Counts per type must add up to the entry total; the breaking flag does not change them.
- Low-confidence entries go to other and are listed so the user can correct them.
`,
} as const;
