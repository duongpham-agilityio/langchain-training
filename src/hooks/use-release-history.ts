import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { listReleaseHistory } from '@/services/list-release-history.ts';
import { PLATFORM_SEARCH_PARAM, RELEASE_SEARCH_PARAM } from '@/constants/routings.ts';
import {
  formatReleaseDateDisplay,
  formatReleaseMonthDisplay,
  formatReleaseShortDateDisplay,
  formatReleaseVersion,
} from '@/lib/release-notes/release-title.ts';
import { groupReleaseHistoryByRecency } from '@/lib/release-notes/group-release-history-by-recency.ts';
import type { ReleaseHistoryRecord } from '@/types/release-history-record.ts';
import {
  ReleaseHistoryFilter,
  ReleaseSendStatus,
  ReleaseStatus,
  type ReleaseHistoryGroup,
  type ReleaseHistoryItem,
} from '@/types/release.ts';
import { KnownPlatformId } from '@/types/platform.ts';

export const RELEASE_HISTORY_QUERY_KEY = ['release-history'];

interface PlatformContent {
  platformId: string;
  label: string;
  content: string | null;
}

// A stored release still carries three named platform bodies plus a
// `platforms` array; History lists one row per platform that has content.
// Send status is derived from the release status until History records a
// real per-platform "sent" flag.
const mapRecordToItems = (record: ReleaseHistoryRecord): ReleaseHistoryItem[] => {
  const {
    id,
    version,
    title,
    releaseDate,
    status,
    github,
    appStore,
    googlePlay,
    platforms,
  } = record;

  const platformContents: PlatformContent[] = [
    { platformId: KnownPlatformId.Github, label: 'GitHub', content: github },
    { platformId: KnownPlatformId.AppStore, label: 'App Store', content: appStore },
    { platformId: KnownPlatformId.GooglePlay, label: 'Google Play', content: googlePlay },
    ...platforms.map(({ platform, label, content }) => ({
      platformId: platform,
      label,
      content,
    })),
  ];

  return platformContents.flatMap(({ platformId, label, content }) =>
    content
      ? [
          {
            id: `${id}:${platformId}`,
            releaseId: id,
            version: formatReleaseVersion(version),
            title,
            platformId,
            platformLabel: label,
            sendStatus:
              status === ReleaseStatus.Published
                ? ReleaseSendStatus.Sent
                : ReleaseSendStatus.NotSent,
            releaseDate,
            date: formatReleaseDateDisplay(releaseDate),
            shortDate: formatReleaseShortDateDisplay(releaseDate),
            monthLabel: formatReleaseMonthDisplay(releaseDate),
            markdown: content,
          },
        ]
      : [],
  );
};

const matchesFilter = (item: ReleaseHistoryItem, filter: ReleaseHistoryFilter): boolean => {
  switch (filter) {
    case ReleaseHistoryFilter.All:
      return true;
    case ReleaseHistoryFilter.Sent:
      return item.sendStatus === ReleaseSendStatus.Sent;
    case ReleaseHistoryFilter.NotSent:
      return item.sendStatus === ReleaseSendStatus.NotSent;
  }
};

const matchesQuery = (item: ReleaseHistoryItem, query: string): boolean => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  const { version, title, platformLabel } = item;
  return `${version} ${title} ${platformLabel}`.toLowerCase().includes(normalizedQuery);
};

interface UseReleaseHistoryResult {
  groups: ReleaseHistoryGroup[];
  selectedItem: ReleaseHistoryItem | undefined;
  selectedItemId: string;
  latestItemId: string | undefined;
  totalCount: number;
  filteredCount: number;
  query: string;
  filter: ReleaseHistoryFilter;
  isLoading: boolean;
  isError: boolean;
  selectItem: (item: ReleaseHistoryItem) => void;
  setQuery: (query: string) => void;
  setFilter: (filter: ReleaseHistoryFilter) => void;
  clearFilters: () => void;
  refetch: () => void;
}

// Selection lives in the URL (`/history?release=…&platform=…`) rather than in
// component state so "Copy link" has something to copy and a reload reopens
// the same notes. Falls back to the newest item when the URL names none.
export const useReleaseHistory = (): UseReleaseHistoryResult => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ReleaseHistoryFilter>(ReleaseHistoryFilter.All);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: RELEASE_HISTORY_QUERY_KEY,
    queryFn: () => listReleaseHistory(),
  });

  const items = data?.releases.flatMap(mapRecordToItems) ?? [];
  const filteredItems = items.filter(
    (item) => matchesFilter(item, filter) && matchesQuery(item, query),
  );

  const selectedReleaseId = searchParams.get(RELEASE_SEARCH_PARAM);
  const selectedPlatformId = searchParams.get(PLATFORM_SEARCH_PARAM);
  const selectedItem =
    items.find(
      (item) =>
        item.releaseId === selectedReleaseId && item.platformId === selectedPlatformId,
    ) ?? items.at(0);

  return {
    groups: groupReleaseHistoryByRecency(filteredItems),
    selectedItem,
    selectedItemId: selectedItem?.id ?? '',
    latestItemId: items.at(0)?.id,
    totalCount: items.length,
    filteredCount: filteredItems.length,
    query,
    filter,
    isLoading,
    isError,
    selectItem: ({ releaseId, platformId }) =>
      setSearchParams({
        [RELEASE_SEARCH_PARAM]: releaseId,
        [PLATFORM_SEARCH_PARAM]: platformId,
      }),
    setQuery,
    setFilter,
    clearFilters: () => {
      setQuery('');
      setFilter(ReleaseHistoryFilter.All);
    },
    refetch: () => void refetch(),
  };
};
