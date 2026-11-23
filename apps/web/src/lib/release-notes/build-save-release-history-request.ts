import type { ReleaseNotesDraft } from '../../types/release-notes-draft';
import type { SaveReleaseHistoryRequest } from '@training/contracts';

// History stores the release object, so a draft that has none (an older
// stored draft) can't be archived — returns null. The release is saved into
// the project the chat belongs to.
export const buildSaveReleaseHistoryRequest = (
  { release }: ReleaseNotesDraft,
  projectId: string,
): SaveReleaseHistoryRequest | null =>
  release ? { projectId, release } : null;
