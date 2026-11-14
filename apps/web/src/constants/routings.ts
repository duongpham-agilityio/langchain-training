export const ROUTE_DASHBOARD = '/';
export const ROUTE_HISTORY = '/history';
export const ROUTE_SIGN_IN = '/sign-in';

// `/?thread=<threadId>` — keeps the open thread across reloads and makes it linkable.
export const THREAD_SEARCH_PARAM = 'thread';

export const buildThreadPath = (threadId: string): string =>
  `${ROUTE_DASHBOARD}?${new URLSearchParams({ [THREAD_SEARCH_PARAM]: threadId })}`;

// `/history?release=<releaseId>` — keeps the selected release across reloads
// and makes "Copy link" point at one release.
export const RELEASE_SEARCH_PARAM = 'release';

export const buildHistoryPath = (releaseId: string): string =>
  `${ROUTE_HISTORY}?${new URLSearchParams({ [RELEASE_SEARCH_PARAM]: releaseId })}`;
