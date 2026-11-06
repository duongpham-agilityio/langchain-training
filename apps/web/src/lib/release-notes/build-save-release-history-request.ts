import type { ReleaseNotesDraft } from '../../types/release-notes-draft';
import type { SaveReleaseHistoryRequest } from '../../types/save-release-history-request';

// History lists a release by version + title, so a draft missing either can't
// be archived yet (the draft schema tells the agent the same) — returns null.
export const buildSaveReleaseHistoryRequest = (
  draft: ReleaseNotesDraft,
): SaveReleaseHistoryRequest | null => {
  const { releaseDate, titleOverride, version, title, platform, label, content } = draft;

  if (!version || !title) return null;

  return { releaseDate, titleOverride, version, title, platform, label, content };
};
