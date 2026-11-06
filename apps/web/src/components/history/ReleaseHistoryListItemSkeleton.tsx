// Placeholder shaped like ReleaseHistoryListItem's three lines (version + date,
// title, platform + status) so the list doesn't jump when data arrives.
const ReleaseHistoryListItemSkeleton = () => (
  <div aria-hidden="true" className="flex w-full animate-pulse flex-col gap-2 px-3 py-2.5">
    <div className="flex items-center gap-2">
      <span className="bg-surface-container h-4 w-14 rounded" />
      <span className="bg-surface-container ml-auto h-3 w-10 rounded" />
    </div>
    <span className="bg-surface-container h-3.5 w-4/5 rounded" />
    <div className="flex items-center">
      <span className="bg-surface-container h-3 w-16 rounded" />
      <span className="bg-surface-container ml-auto h-3 w-12 rounded" />
    </div>
  </div>
);

export default ReleaseHistoryListItemSkeleton;
