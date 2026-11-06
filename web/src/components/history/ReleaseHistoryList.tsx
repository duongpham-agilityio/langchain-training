import { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import Button, { ButtonSize, ButtonVariant } from '@/components/common/Button.tsx';
import EmptyState from '@/components/common/EmptyState.tsx';
import Input from '@/components/common/Input.tsx';
import Kbd from '@/components/common/Kbd.tsx';
import Tabs, { TabsVariant, type TabItem } from '@/components/common/Tabs.tsx';
import ReleaseHistoryListItem from './ReleaseHistoryListItem.tsx';
import ReleaseHistoryListItemSkeleton from './ReleaseHistoryListItemSkeleton.tsx';
import {
  ReleaseHistoryFilter,
  type ReleaseHistoryGroup,
  type ReleaseHistoryItem,
} from '@/types/release.ts';

const FILTER_ITEMS: TabItem[] = [
  { value: ReleaseHistoryFilter.All, label: 'All' },
  { value: ReleaseHistoryFilter.Sent, label: 'Sent' },
  { value: ReleaseHistoryFilter.NotSent, label: 'Not sent' },
];

const SKELETON_ROW_COUNT = 5;

// `/` only focuses search when the user isn't already typing somewhere —
// otherwise the shortcut would swallow a literal slash in the chat composer.
const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement);

interface ReleaseHistoryListProps {
  groups: ReleaseHistoryGroup[];
  isLoading: boolean;
  selectedItemId: string;
  latestItemId: string | undefined;
  query: string;
  filter: ReleaseHistoryFilter;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: ReleaseHistoryFilter) => void;
  onClearFilters: () => void;
  onSelectItem: (item: ReleaseHistoryItem) => void;
}

const ReleaseHistoryList = ({
  groups,
  isLoading,
  selectedItemId,
  latestItemId,
  query,
  filter,
  onQueryChange,
  onFilterChange,
  onClearFilters,
  onSelectItem,
}: ReleaseHistoryListProps) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || isTypingTarget(event.target)) return;
      event.preventDefault();
      searchInputRef.current?.focus();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="border-outline-subtle flex shrink-0 flex-col gap-2.5 border-b px-3.5 pt-3.5 pb-3">
        <label htmlFor="release-history-search" className="sr-only">
          Search releases
        </label>
        <Input
          ref={searchInputRef}
          id="release-history-search"
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search version, title or platform"
          icon={<Search className="text-on-surface-muted size-3.75" />}
          rightSlot={<Kbd className="mr-1.5">/</Kbd>}
          className="border-outline-strong placeholder:text-on-surface-muted focus:border-primary-fixed-dim focus:ring-primary-soft h-9 rounded-[9px] py-0 pr-10 pl-8.5 text-[13.5px] focus:ring-3"
        />
        <div role="group" aria-label="Filter by status">
          <Tabs
            items={FILTER_ITEMS}
            value={filter}
            onChange={(value) => onFilterChange(value as ReleaseHistoryFilter)}
            variant={TabsVariant.Segmented}
            containerClassName="flex"
            className="flex-1 justify-center"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? (
          <div role="status" aria-label="Loading releases" className="flex flex-col gap-0.5 pt-3.5">
            <span className="bg-surface-container mx-2.5 mb-1.5 h-3 w-24 animate-pulse rounded" />
            {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
              <ReleaseHistoryListItemSkeleton key={index} />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Search className="size-5" />}
            title="No releases found"
            description="Try another search, or clear the filters."
            action={
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Sm}
                onClick={onClearFilters}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          groups.map(({ label, items }) => (
            <section key={label} aria-label={label}>
              <div className="text-label-xs text-on-surface-muted px-2.5 pt-3.5 pb-1.5 font-semibold">
                {label}
              </div>
              <div className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <ReleaseHistoryListItem
                    key={item.id}
                    item={item}
                    isLatest={item.id === latestItemId}
                    isSelected={item.id === selectedItemId}
                    onSelect={onSelectItem}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default ReleaseHistoryList;
