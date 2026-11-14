import { useMemo, useRef, useState } from 'react';
import type { Release } from '@training/contracts';
import {
  AlertTriangle,
  Archive,
  Check,
  Code2,
  Download,
  Eye,
  Loader2,
  X,
} from 'lucide-react';
import Button, { ButtonVariant } from '@/components/common/Button.tsx';
import IconButton from '@/components/common/IconButton.tsx';
import CopyButton, {
  type CopyHandler,
} from '@/components/common/CopyButton.tsx';
import Tabs, { TabsVariant, type TabItem } from '@/components/common/Tabs.tsx';
import {
  PreviewKind,
  getFormatPresentation,
} from '@/lib/release-notes/format-presentation.ts';
import { usePreviewSelection } from '@/hooks/use-preview-selection.ts';
import { useSendEditRequest } from '@/hooks/use-send-edit-request.ts';
import { mapMarkdownItemIds } from '@/lib/release-notes/map-markdown-item-ids.ts';
import MarkdownPreview from './MarkdownPreview.tsx';
import PreviewEditMenu from './PreviewEditMenu.tsx';
import RawMarkdownView from './RawMarkdownView.tsx';

const enum PreviewTab {
  Preview = 'preview',
  Source = 'source',
}

const TAB_ITEMS: TabItem[] = [
  {
    value: PreviewTab.Preview,
    label: 'Preview',
    icon: <Eye className="size-3.25" />,
  },
  {
    value: PreviewTab.Source,
    label: 'Source',
    icon: <Code2 className="size-3.25" />,
  },
];

interface LivePreviewPanelProps {
  // The rendered text of the shown draft's format; null when there is none.
  content: string | null;
  // Format id and display name; the format drives how the Preview tab draws the text.
  format: string | null;
  formatLabel: string | null;
  // The draft's file name, shown above the preview.
  fileName: string | null;
  // The limit error of a draft that could not be rendered; shown instead of text.
  renderError: string | null;
  // The release object and hash of the shown draft; with them the Markdown preview items carry
  // their property id and a selection can send an edit request. null disables editing.
  release: Release | null;
  hash: string | null;
  onCopy: CopyHandler;
  onExport: () => void;
  onArchive: () => void;
  isArchiving: boolean;
  isArchived: boolean;
  // False when the draft lacks a version/title, which History requires.
  canArchive: boolean;
  onClose: () => void;
}

const LivePreviewPanel = ({
  content,
  format,
  formatLabel,
  fileName,
  renderError,
  release,
  hash,
  onCopy,
  onExport,
  onArchive,
  isArchiving,
  isArchived,
  canArchive,
  onClose,
}: LivePreviewPanelProps) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>(PreviewTab.Preview);
  const previewKind = getFormatPresentation(format ?? '').preview;
  const previewRef = useRef<HTMLDivElement>(null);
  const sendEditRequest = useSendEditRequest();

  // Only the Markdown render is drawn by us, so only its items can carry ids. Other formats
  // (text, sandboxed HTML) offer no edit menu.
  const itemIds = useMemo(
    () =>
      content && release && previewKind === PreviewKind.Markdown
        ? mapMarkdownItemIds(content, release)
        : null,
    [content, release, previewKind],
  );
  const canEdit = itemIds !== null && itemIds.size > 0 && hash !== null;
  const { selection, capture, dismiss } = usePreviewSelection(
    previewRef,
    canEdit && activeTab === PreviewTab.Preview,
  );

  const handleEditSubmit = (request: string) => {
    if (!selection || !release || !hash) return;
    const isSent = sendEditRequest({
      itemId: selection.itemId,
      selectedText: selection.text,
      release,
      hash,
      request,
    });
    if (isSent) {
      window.getSelection()?.removeAllRanges();
      dismiss();
    }
  };

  const renderPreview = () => {
    if (!content) {
      return <MarkdownPreview markdown={null} />;
    }
    switch (previewKind) {
      case PreviewKind.Markdown:
        return (
          <MarkdownPreview
            markdown={content}
            className="mt-1.5"
            itemIds={itemIds ?? undefined}
          />
        );
      case PreviewKind.Html:
        // Sandboxed with no permissions: the email is model-generated HTML and
        // must not run scripts or reach the app's origin.
        return (
          <iframe
            title="HTML email preview"
            sandbox=""
            srcDoc={content}
            className="border-outline-subtle mt-1.5 h-[70vh] w-full rounded-lg border bg-white"
          />
        );
      default:
        return (
          <pre className="text-on-surface mt-1.5 font-mono text-[12.5px] leading-[1.7] break-words whitespace-pre-wrap">
            {content}
          </pre>
        );
    }
  };

  const renderArchiveContent = () => {
    if (isArchiving) {
      return (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          Archiving…
        </>
      );
    }
    if (isArchived) {
      return (
        <>
          <Check className="size-3.5" />
          Archived
        </>
      );
    }
    return (
      <>
        <Archive className="size-3.5" />
        Archive
      </>
    );
  };

  return (
    <section
      className="bg-surface-container-lowest flex min-h-0 flex-1 flex-col"
      aria-label="Release notes preview"
    >
      <div className="flex h-13 shrink-0 items-center justify-between pr-3 pl-5">
        <span className="text-body-md text-on-surface font-semibold">
          Release notes
          {formatLabel && !renderError && (
            <span className="text-on-surface-variant ml-2 font-normal">
              {formatLabel}
            </span>
          )}
        </span>
        <IconButton
          icon={<X className="size-4" />}
          aria-label="Close live preview"
          onClick={onClose}
        />
      </div>

      <div className="border-outline-subtle flex h-12 shrink-0 items-center justify-between border-b pr-3 pl-5">
        <Tabs
          items={TAB_ITEMS}
          value={activeTab}
          onChange={(value) => setActiveTab(value as PreviewTab)}
          variant={TabsVariant.Segmented}
        />
        <div className="flex items-center gap-1">
          <CopyButton isIconOnly onCopy={onCopy} disabled={!content} />
          <IconButton
            icon={<Download className="size-4" />}
            aria-label="Export release notes"
            disabled={!content}
            onClick={onExport}
          />
          <Button
            variant={ButtonVariant.Primary}
            disabled={!content || !canArchive || isArchiving || isArchived}
            title={
              canArchive
                ? undefined
                : 'Ask Release Builder for a version and title to archive'
            }
            onClick={onArchive}
            className="text-body-sm ml-1 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 py-0 font-semibold shadow-sm"
          >
            {renderArchiveContent()}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {renderError ? (
          <div
            role="alert"
            className="border-error text-error m-8 flex items-start gap-2 rounded-xl border px-4 py-3"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span className="text-body-md break-words">{renderError}</span>
          </div>
        ) : activeTab === PreviewTab.Preview ? (
          <div
            ref={previewRef}
            className="px-8 py-7"
            onMouseUp={canEdit ? capture : undefined}
            onKeyUp={canEdit ? capture : undefined}
          >
            {fileName && (
              <div className="text-on-surface-muted font-mono text-[11px]">
                {fileName}
              </div>
            )}
            {renderPreview()}
            {canEdit && selection && (
              <PreviewEditMenu
                key={`${selection.itemId}:${selection.text}`}
                x={selection.x}
                y={selection.y}
                selectedText={selection.text}
                onSubmit={handleEditSubmit}
                onClose={dismiss}
              />
            )}
          </div>
        ) : (
          <RawMarkdownView markdown={content} />
        )}
      </div>
    </section>
  );
};

export default LivePreviewPanel;
