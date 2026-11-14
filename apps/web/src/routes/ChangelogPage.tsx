import { History, RotateCcw } from 'lucide-react';
import Button, { ButtonSize, ButtonVariant } from '@/components/common/Button.tsx';
import EmptyState from '@/components/common/EmptyState.tsx';
import ErrorBoundary from '@/components/common/ErrorBoundary.tsx';
import ChangelogFilters from '@/components/changelog/ChangelogFilters.tsx';
import ChangelogRelease from '@/components/changelog/ChangelogRelease.tsx';
import { useChangelog } from '@/hooks/use-changelog.ts';

const ChangelogPage = () => {
  const {
    entries,
    filters,
    hasActiveFilters,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    setFilters,
    clearFilters,
    loadMore,
    refetch,
  } = useChangelog();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div role="status" aria-label="Loading changelog" className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <span
              key={index}
              className="bg-surface-container h-24 animate-pulse rounded-[10px]"
            />
          ))}
        </div>
      );
    }
    if (isError) {
      return (
        <EmptyState
          icon={<RotateCcw className="size-5" />}
          title="Couldn’t load the changelog"
          description="The request failed. Check your connection and try again."
          action={
            <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm} onClick={refetch}>
              Retry
            </Button>
          }
        />
      );
    }
    if (entries.length === 0) {
      return (
        <EmptyState
          icon={<History className="size-5" />}
          title={hasActiveFilters ? 'No releases match' : 'No releases yet'}
          description={
            hasActiveFilters
              ? 'Try another version or date range.'
              : 'Archive a release from a thread and it will show up here.'
          }
          action={
            hasActiveFilters ? (
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Sm}
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      );
    }
    return (
      <>
        <ol className="flex flex-col">
          {entries.map((entry) => (
            <ChangelogRelease key={entry.id} entry={entry} />
          ))}
        </ol>
        {hasNextPage && (
          <div className="flex justify-center pt-6">
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Sm}
              onClick={loadMore}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="border-outline-subtle flex h-14 shrink-0 items-center border-b pr-4 pl-6">
        <h1 className="text-body-md text-on-surface min-w-0 truncate font-semibold">
          Changelog
        </h1>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-8 pt-5 pb-6">
        <ChangelogFilters filters={filters} onApply={setFilters} />
        <ErrorBoundary title="Changelog unavailable">{renderContent()}</ErrorBoundary>
      </div>
    </div>
  );
};

export default ChangelogPage;
