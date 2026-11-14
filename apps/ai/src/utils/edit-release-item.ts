// Constants
import { EDIT_RELEASE_ITEM_MESSAGES, OPENING_LINE_ITEM_ID } from "@/constants";

// Schemas
import type { Release } from "@/schemas";

// Utils
import { hashRelease } from "./hash-release";

export type ApplyReleaseEditResult =
  | { ok: true; release: Release; previous: string }
  | { ok: false; error: string };

/**
 * Replaces the description of one item (`openingLine` or a change id) and nothing else: `type`,
 * `breaking`, `refs`, ids, version and date stay as they are, so the version cannot change here.
 */
export const applyReleaseEdit = (
  release: Release,
  itemId: string,
  description: string,
): ApplyReleaseEditResult => {
  if (itemId === OPENING_LINE_ITEM_ID) {
    return { ok: true, release: { ...release, openingLine: description }, previous: release.openingLine };
  }
  const target = release.changes.find((change) => change.id === itemId);
  if (!target) return { ok: false, error: EDIT_RELEASE_ITEM_MESSAGES.UNKNOWN_ITEM(itemId) };
  return {
    ok: true,
    release: {
      ...release,
      changes: release.changes.map((change) => (change.id === itemId ? { ...change, description } : change)),
    },
    previous: target.description,
  };
};

/**
 * The edit was requested against `release`/`requestHash`. It is refused when that hash is not the
 * hash of that release, or (when the app told us which draft is on screen) not the on-screen draft's.
 */
export const checkEditHash = (
  requestHash: string,
  release: Release,
  currentHash?: string,
): { ok: true } | { ok: false; error: string } =>
  requestHash === hashRelease(release) && (currentHash === undefined || requestHash === currentHash)
    ? { ok: true }
    : { ok: false, error: EDIT_RELEASE_ITEM_MESSAGES.STALE_DRAFT };
