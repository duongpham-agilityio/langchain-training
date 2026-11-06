export const COPILOTKIT_ROUTE_PATH = '/copilotkit';

export const SLACK_PUBLISH_ROUTE_PATH = '/slack/publish';

export const MEMORY_THREADS_ROUTE_PATH = '/api/memory/threads';

export const RELEASE_HISTORY_ROUTE_PATH = '/release-history';

export const RELEASE_HISTORY_DETAIL_ROUTE_PATH = '/release-history/:id';

export const buildReleaseHistoryDetailPath = (id: string): string =>
  `${RELEASE_HISTORY_ROUTE_PATH}/${id}`;
