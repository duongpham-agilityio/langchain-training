import type { ChangeType } from '@training/contracts';

export const CHANGELOG_PAGE_SIZE = 10;

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  feature: 'Features',
  fix: 'Fixes',
  performance: 'Performance',
  docs: 'Docs',
  internal: 'Internal',
  other: 'Other',
};
