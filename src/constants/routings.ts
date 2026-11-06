export const ROUTE_DASHBOARD = '/';
export const ROUTE_HISTORY = '/history';
export const ROUTE_SIGN_IN = '/sign-in';

// `/?thread=<threadId>` — keeps the open thread across reloads and makes it linkable.
export const THREAD_SEARCH_PARAM = 'thread';

export const buildThreadPath = (threadId: string): string =>
  `${ROUTE_DASHBOARD}?${new URLSearchParams({ [THREAD_SEARCH_PARAM]: threadId })}`;

// `/history?release=<releaseId>&platform=<platformId>` — keeps the selected
// release notes across reloads and makes "Copy link" point at one item.
export const RELEASE_SEARCH_PARAM = 'release';
export const PLATFORM_SEARCH_PARAM = 'platform';

export const buildHistoryPath = (releaseId: string, platformId: string): string =>
  `${ROUTE_HISTORY}?${new URLSearchParams({
    [RELEASE_SEARCH_PARAM]: releaseId,
    [PLATFORM_SEARCH_PARAM]: platformId,
  })}`;
