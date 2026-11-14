import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { listReleaseHistory } from '@/services/list-release-history.ts';
import { RELEASE_SEARCH_PARAM } from '@/constants/routings.ts';
import {
  formatReleaseDateDisplay,
  formatReleaseMonthDisplay,
  formatReleaseShortDateDisplay,
  formatReleaseVersion,
} from '@/lib/release-notes/release-title.ts';
import { groupReleaseHistoryByRecency } from '@/lib/release-notes/group-release-history-by-recency.ts';
import {
  RELEASE_FORMAT_LABELS,
  type ReleaseFormat,
  type ReleaseHistoryRecord,
} from '@training/contracts';
import {
  ReleaseHistoryFilter,
  ReleaseSendStatus,
  ReleaseStatus,
  type ReleaseHistoryGroup,
  type ReleaseHistoryItem,
} from '@/types/release.ts';

export const RELEASE_HISTORY_QUERY_KEY = ['release-history'];

export const DEFAULT_HISTORY_FORMAT: ReleaseFormat = 'markdown';

// One item per stored release. The server renders `text` in the requested
// format on read. Send status is derived from the release status until
// History records a real "sent" flag.
const mapRecordToItem = ({
  id,
  release,
  status,
  format,
  text,
  emailRecipients,
}: ReleaseHistoryRecord): ReleaseHistoryItem => ({
  id,
  version: formatReleaseVersion(release.version),
  title: release.openingLine,
  formatId: format,
  formatLabel: RELEASE_FORMAT_LABELS[format],
  sendStatus:
    status === ReleaseStatus.Published
      ? ReleaseSendStatus.Sent
      : ReleaseSendStatus.NotSent,
  emailRecipients,
  releaseDate: release.date,
  date: formatReleaseDateDisplay(release.date),
  shortDate: formatReleaseShortDateDisplay(release.date),
  monthLabel: formatReleaseMonthDisplay(release.date),
  text,
});

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
  const { version, title } = item;
  return `${version} ${title}`.toLowerCase().includes(normalizedQuery);
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
  format: ReleaseFormat;
  isLoading: boolean;
  isError: boolean;
  selectItem: (item: ReleaseHistoryItem) => void;
  setQuery: (query: string) => void;
  setFilter: (filter: ReleaseHistoryFilter) => void;
  setFormat: (format: ReleaseFormat) => void;
  clearFilters: () => void;
  refetch: () => void;
}

// Selection lives in the URL (`/history?release=…`) rather than in
// component state so "Copy link" has something to copy and a reload reopens
// the same notes. Falls back to the newest item when the URL names none.
export const useReleaseHistory = (): UseReleaseHistoryResult => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ReleaseHistoryFilter>(ReleaseHistoryFilter.All);
  const [format, setFormat] = useState<ReleaseFormat>(DEFAULT_HISTORY_FORMAT);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...RELEASE_HISTORY_QUERY_KEY, format],
    queryFn: () => listReleaseHistory({ format }),
  });

  const items = data?.releases.map(mapRecordToItem) ?? [];
  const filteredItems = items.filter(
    (item) => matchesFilter(item, filter) && matchesQuery(item, query),
  );

  const selectedReleaseId = searchParams.get(RELEASE_SEARCH_PARAM);
  const selectedItem =
    items.find((item) => item.id === selectedReleaseId) ?? items.at(0);

  return {
    groups: groupReleaseHistoryByRecency(filteredItems),
    selectedItem,
    selectedItemId: selectedItem?.id ?? '',
    latestItemId: items.at(0)?.id,
    totalCount: items.length,
    filteredCount: filteredItems.length,
    query,
    filter,
    format,
    isLoading,
    isError,
    selectItem: ({ id }) => setSearchParams({ [RELEASE_SEARCH_PARAM]: id }),
    setQuery,
    setFilter,
    setFormat,
    clearFilters: () => {
      setQuery('');
      setFilter(ReleaseHistoryFilter.All);
    },
    refetch: () => void refetch(),
  };
};
