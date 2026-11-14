import { CHANGE_TYPES, type Change, type ChangeType } from '@training/contracts';

export interface ChangeTypeGroup {
  type: ChangeType;
  changes: Change[];
}

// Follows CHANGE_TYPES order (the release-reporting order) and skips empty
// types, so only the types a release actually stored are shown.
export const groupChangesByType = (changes: Change[]): ChangeTypeGroup[] =>
  CHANGE_TYPES.map((type) => ({
    type,
    changes: changes.filter((change) => change.type === type),
  })).filter((group) => group.changes.length > 0);
