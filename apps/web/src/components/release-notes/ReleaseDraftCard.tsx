import { FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn.ts';

interface ReleaseDraftCardProps {
  title: string;
  subtitle?: string;
  isGenerating: boolean;
  isViewing?: boolean;
  onOpen: () => void;
}

// The visible surface for a renderReleaseNotesPreview tool call — the design's
// `.doc-card`: a pale tile, the draft's name, and whether the preview panel is
// currently showing it.
const ReleaseDraftCard = ({
  title,
  subtitle,
  isGenerating,
  isViewing = false,
  onOpen,
}: ReleaseDraftCardProps) => (
  <button
    type="button"
    onClick={onOpen}
    disabled={isGenerating}
    className={cn(
      'bg-surface-container-lowest flex w-full max-w-110 cursor-pointer items-center gap-3 rounded-xl border py-2.5 pr-3.5 pl-2.5 text-left shadow-sm transition-shadow disabled:cursor-default',
      isViewing
        ? 'border-primary-soft-strong shadow-[0_0_0_3px_var(--color-primary-soft)]'
        : 'border-outline-subtle hover:border-outline-strong hover:shadow-md',
    )}
  >
    <span className="bg-primary-soft text-primary flex size-10 shrink-0 items-center justify-center rounded-[9px]">
      {isGenerating ? (
        <Loader2 className="size-4.75 animate-spin" />
      ) : (
        <FileText className="size-4.75" />
      )}
    </span>
    <span className="min-w-0 flex-1">
      <span className="text-on-surface block truncate text-[13.5px] leading-5 font-semibold">
        {isGenerating ? 'Generating release notes…' : title}
      </span>
      {!isGenerating && subtitle && (
        <span className="text-on-surface-muted mt-px block truncate text-[12px] leading-4">
          {subtitle}
        </span>
      )}
    </span>
    {!isGenerating && (
      <span
        className={cn(
          'shrink-0 text-[12px] font-semibold',
          isViewing ? 'text-on-primary-soft' : 'text-on-surface-variant',
        )}
      >
        {isViewing ? 'Viewing' : 'Open'}
      </span>
    )}
  </button>
);

export default ReleaseDraftCard;
