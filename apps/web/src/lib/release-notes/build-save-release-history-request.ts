import type { ReleaseNotesDraft } from '../../types/release-notes-draft';
import type { SaveReleaseHistoryRequest } from '@training/contracts';

// History stores the release object, so a draft that has none (an older
// stored draft) can't be archived — returns null.
export const buildSaveReleaseHistoryRequest = ({
  release,
}: ReleaseNotesDraft): SaveReleaseHistoryRequest | null =>
  release ? { release } : null;
