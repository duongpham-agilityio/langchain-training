/** Change types of a release, in `release-reporting` order. Breaking is a flag, not a type. */
export const CHANGE_TYPES = [
  "feature",
  "fix",
  "performance",
  "docs",
  "internal",
  "other",
] as const;
