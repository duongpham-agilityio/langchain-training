const VERSION_PATTERN = /\bv?(\d+\.\d+\.\d+)\b/g;

/**
 * Versions (MAJOR.MINOR.PATCH) that the answer names but the user never saved. Pure, so the
 * "names only real releases" rule is checked in code and not only asked of the model.
 */
export const findUnknownVersions = (markdown: string, knownVersions: readonly string[]): string[] => {
  const known = new Set(knownVersions);
  const unknown = new Set<string>();
  for (const match of markdown.matchAll(VERSION_PATTERN)) {
    if (!known.has(match[1])) unknown.add(match[1]);
  }
  return [...unknown];
};
