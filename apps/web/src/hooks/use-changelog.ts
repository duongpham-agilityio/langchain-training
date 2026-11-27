import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { ChangelogEntry } from '@training/contracts';
import { listChangelog } from '@/services/list-changelog.ts';
import { CHANGELOG_PAGE_SIZE } from '@/constants/changelog.ts';

export const CHANGELOG_QUERY_KEY = ['changelog'];

export interface ChangelogFilters {
  // `<input type="date">` values (`YYYY-MM-DD`), empty when unset.
  from: string;
  to: string;
  // Empty = all projects.
  projectId: string;
}

export const EMPTY_CHANGELOG_FILTERS: ChangelogFilters = {
  from: '',
  to: '',
  projectId: '',
};

// The server takes `YYYYMMDD`; date inputs give `YYYY-MM-DD`.
const toApiDate = (value: string): string => value.replaceAll('-', '');

const buildQuery = (
  filters: ChangelogFilters,
  cursor: string | null,
): Record<string, string> => {
  const query: Record<string, string> = { limit: String(CHANGELOG_PAGE_SIZE) };
  if (filters.from) query.from = toApiDate(filters.from);
  if (filters.to) query.to = toApiDate(filters.to);
  if (filters.projectId) query.projectId = filters.projectId;
  if (cursor) query.cursor = cursor;
  return query;
};

interface UseChangelogResult {
  entries: ChangelogEntry[];
  filters: ChangelogFilters;
  hasActiveFilters: boolean;
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  setFilters: (filters: ChangelogFilters) => void;
  clearFilters: () => void;
  loadMore: () => void;
  refetch: () => void;
}

// Filters live in the query key so changing one starts a fresh list from the
// first page; "load more" follows the server's `nextCursor`.
export const useChangelog = (): UseChangelogResult => {
  const [filters, setFilters] = useState<ChangelogFilters>(EMPTY_CHANGELOG_FILTERS);

  const query = useInfiniteQuery({
    queryKey: [...CHANGELOG_QUERY_KEY, filters],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => listChangelog(buildQuery(filters, pageParam)),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  return {
    entries: query.data?.pages.flatMap((page) => page.releases) ?? [],
    filters,
    hasActiveFilters: Boolean(filters.from || filters.to || filters.projectId),
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    setFilters,
    clearFilters: () => setFilters(EMPTY_CHANGELOG_FILTERS),
    loadMore: () => void query.fetchNextPage(),
    refetch: () => void query.refetch(),
  };
};
