import { Archive, LayoutDashboard, RotateCcw } from 'lucide-react';
import Button, {
  ButtonSize,
  ButtonVariant,
} from '@/components/common/Button.tsx';
import Card, { CardEmphasis } from '@/components/common/Card.tsx';
import EmptyState from '@/components/common/EmptyState.tsx';
import ErrorBoundary from '@/components/common/ErrorBoundary.tsx';
import ReleaseHistoryList from '@/components/history/ReleaseHistoryList.tsx';
import ReleaseDetailHeader from '@/components/history/ReleaseDetailHeader.tsx';
import ReleaseDetailBody from '@/components/history/ReleaseDetailBody.tsx';
import { buildHistoryPath } from '@/constants/routings.ts';
// import { useComingSoon } from '@/hooks/use-coming-soon.ts'; // TODO(coming-soon)
import { useReleaseHistory } from '@/hooks/use-release-history.ts';
import { useThreadSession } from '@/hooks/use-thread-session.ts';
import { useSendReleaseToSlack } from '@/hooks/use-send-release-to-slack.ts';
import { useToast } from '@/hooks/use-toast.ts';
import { ToastKind } from '@/store/toast-store.ts';
import { cn } from '@/lib/cn.ts';
import { copyText } from '@/lib/clipboard.ts';
import { downloadTextFile } from '@/lib/download-text-file.ts';
import {
  buildReleaseHistoryFileName,
  describeReleaseHistoryItem,
} from '@/lib/release-notes/release-title.ts';

// The design's `.card`: 14px radius, hairline ring, no inner padding — each
// pane owns its own spacing.
const PANE_CARD_CLASSES =
  'border-outline-subtle flex flex-col overflow-hidden rounded-[14px] p-0 shadow-[0_1px_2px_rgba(23,21,28,0.04)]';

// Send to Slack, Copy, Export and Copy link are wired. TODO(coming-soon): "Open in
// new thread" and "Remove from history" are disabled until implemented — the
// first needs a way to hand a draft to a fresh thread, the second a delete
// endpoint that History's repository doesn't have yet.
const HistoryPage = () => {
  const { showToast } = useToast();
  // const { showComingSoon } = useComingSoon();
  const { sendToSlack, isSending } = useSendReleaseToSlack();
  // Leaving History means picking up the work again, not resuming whatever
  // thread happened to be open — the same fresh conversation the sidebar's New
  // chat starts.
  const { startNewChat } = useThreadSession();
  const {
    groups,
    selectedItem,
    selectedItemId,
    latestItemId,
    totalCount,
    filteredCount,
    query,
    filter,
    isLoading,
    isError,
    selectItem,
    setQuery,
    setFilter,
    clearFilters,
    refetch,
  } = useReleaseHistory();

  const countLabel =
    filteredCount === totalCount
      ? `${totalCount} archived`
      : `${filteredCount} of ${totalCount} archived`;

  const handleCopy = async (): Promise<void> => {
    if (!selectedItem) return;

    const isCopied = await copyText(selectedItem.markdown);
    showToast(
      isCopied
        ? {
            kind: ToastKind.Success,
            title: 'Copied to clipboard',
            description: describeReleaseHistoryItem(selectedItem),
          }
        : { kind: ToastKind.Error, title: 'Couldn’t copy release notes' },
    );
  };

  const handleExport = () => {
    if (!selectedItem) return;

    const fileName = buildReleaseHistoryFileName(selectedItem);
    downloadTextFile(fileName, selectedItem.markdown);
    showToast({
      kind: ToastKind.Success,
      title: `Exported ${fileName}`,
      description: 'Saved to your Downloads folder.',
    });
  };

  const handleCopyLink = async (): Promise<void> => {
    if (!selectedItem) return;

    const { releaseId, platformId } = selectedItem;
    const isCopied = await copyText(
      `${window.location.origin}${buildHistoryPath(releaseId, platformId)}`,
    );
    showToast(
      isCopied
        ? {
            kind: ToastKind.Success,
            title: 'Link copied',
            description: describeReleaseHistoryItem(selectedItem),
          }
        : { kind: ToastKind.Error, title: 'Couldn’t copy the link' },
    );
  };

  const renderListContent = () => {
    if (isError) {
      return (
        <EmptyState
          icon={<RotateCcw className="size-5" />}
          title="Couldn’t load release history"
          description="The request failed. Check your connection and try again."
          action={
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Sm}
              onClick={refetch}
            >
              Retry
            </Button>
          }
        />
      );
    }
    return (
      <ReleaseHistoryList
        groups={groups}
        isLoading={isLoading}
        selectedItemId={selectedItemId}
        latestItemId={latestItemId}
        query={query}
        filter={filter}
        onQueryChange={setQuery}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        onSelectItem={selectItem}
      />
    );
  };

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="border-outline-subtle flex h-14 shrink-0 items-center justify-between gap-4 border-b pr-4 pl-6">
        <h1 className="text-body-md text-on-surface min-w-0 truncate font-semibold">
          Release history
        </h1>
        <div className="flex shrink-0 items-center gap-3">
          {!isLoading && !isError && (
            <span className="text-on-surface-muted text-[12.5px] tabular-nums">
              {countLabel}
            </span>
          )}
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            onClick={startNewChat}
          >
            <LayoutDashboard className="size-3.75" />
            Go to Dashboard
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-8 pt-5 pb-6">
        <p className="text-on-surface-muted shrink-0 text-[13.5px]">
          Release notes you’ve archived.
        </p>

        <div className="flex min-h-0 flex-1 gap-5">
          <Card
            emphasis={CardEmphasis.Outlined}
            className={cn(PANE_CARD_CLASSES, 'w-85 shrink-0')}
          >
            <ErrorBoundary title="Release history unavailable">
              {renderListContent()}
            </ErrorBoundary>
          </Card>

          <Card
            emphasis={CardEmphasis.Outlined}
            className={cn(PANE_CARD_CLASSES, 'min-w-0 flex-1')}
          >
            <ErrorBoundary title="Release detail unavailable">
              {selectedItem ? (
                <>
                  <ReleaseDetailHeader
                    item={selectedItem}
                    onSendToSlack={() => sendToSlack(selectedItem)}
                    isSending={isSending}
                    onExport={handleExport}
                    onCopy={() => void handleCopy()}
                    // TODO(coming-soon): onOpenInNewThread / onRemove — to be implemented later.
                    // onOpenInNewThread={() => showComingSoon('Open in new thread')}
                    onCopyLink={() => void handleCopyLink()}
                    // onRemove={() => showComingSoon('Remove from history')}
                  />
                  <ReleaseDetailBody markdown={selectedItem.markdown} />
                </>
              ) : (
                !isLoading && (
                  <EmptyState
                    icon={<Archive className="size-5" />}
                    title="Nothing archived yet"
                    description="Archive a draft from a thread and it will show up here."
                    action={
                      <Button
                        variant={ButtonVariant.Secondary}
                        size={ButtonSize.Sm}
                        onClick={startNewChat}
                      >
                        Go to Dashboard
                      </Button>
                    }
                    className="flex-1 justify-center"
                  />
                )
              )}
            </ErrorBoundary>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
