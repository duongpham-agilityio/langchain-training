import { RELEASE_HISTORY_PATH } from '@training/contracts';

// The paths both apps use (runtime, Slack, threads, release history) live in
// @training/contracts. Only this client-side router pattern is web-only.
export const RELEASE_HISTORY_DETAIL_ROUTE_PATH = '/release-history/:id';

export const buildReleaseHistoryDetailPath = (id: string): string =>
  `${RELEASE_HISTORY_PATH}/${id}`;
