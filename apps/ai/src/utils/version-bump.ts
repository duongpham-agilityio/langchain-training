// Constants
import {
  FIRST_RELEASE_VERSION,
  RELEASE_CHANGE_TYPE_FEATURE,
  RELEASE_VERSION_PATTERN,
} from "@/constants";

export type VersionBumpChange = { type: string; breaking: boolean };

/**
 * Computes the next release version in code, not in the LLM.
 * Any breaking change = major, else any feature = minor, else patch.
 * A user-stated version wins as given (no semver check).
 */
export const nextVersion = (
  previousVersion: string | null | undefined,
  changes: VersionBumpChange[],
  statedVersion?: string | null,
): string => {
  if (statedVersion) return statedVersion;
  if (!previousVersion) return FIRST_RELEASE_VERSION;
  if (!RELEASE_VERSION_PATTERN.test(previousVersion)) {
    throw new Error(`Invalid previous version: ${previousVersion}`);
  }

  const [major, minor, patch] = previousVersion.split(".").map(Number);
  if (changes.some((change) => change.breaking)) return `${major + 1}.0.0`;
  if (changes.some((change) => change.type === RELEASE_CHANGE_TYPE_FEATURE)) {
    return `${major}.${minor + 1}.0`;
  }
  return `${major}.${minor}.${patch + 1}`;
};
