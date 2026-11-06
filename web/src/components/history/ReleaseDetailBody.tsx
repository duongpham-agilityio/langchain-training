import { cn } from '@/lib/cn.ts';
import MarkdownPreview from '@/components/release-notes/MarkdownPreview.tsx';
import { parseReleaseNoteSections } from '@/lib/release-notes/parse-release-note-sections.ts';

interface ReleaseDetailBodyProps {
  markdown: string;
}

// Section dot colours follow the design: fixes rose, performance amber,
// chores grey, everything else brand purple. Matched by keyword so emoji or
// wording variations in generated headings ("🐛 Bug Fixes") still map.
const dotClassFor = (sectionTitle: string): string => {
  const normalizedTitle = sectionTitle.toLowerCase();
  if (normalizedTitle.includes('fix') || normalizedTitle.includes('breaking')) {
    return 'bg-error-rose';
  }
  if (normalizedTitle.includes('perf')) return 'bg-amber-700';
  if (normalizedTitle.includes('chore') || normalizedTitle.includes('other')) {
    return 'bg-outline/80';
  }
  return 'bg-primary';
};

const ReleaseDetailBody = ({ markdown }: ReleaseDetailBodyProps) => {
  const sections = parseReleaseNoteSections(markdown);

  return (
    <article className="min-h-0 flex-1 overflow-y-auto px-8 pt-7 pb-8">
      <div className="flex max-w-170 flex-col gap-7">
        {sections.length === 0 ? (
          <MarkdownPreview markdown={markdown} />
        ) : (
          sections.map(({ title, items }, sectionIndex) => (
            <section key={`${title}-${sectionIndex}`}>
              <h3 className="text-body-sm text-on-surface mb-3 flex items-center gap-2 font-semibold">
                {title}
                <span className="bg-surface-container text-on-surface-muted rounded-full px-1.75 py-px text-[11px] font-semibold">
                  {items.length}
                </span>
              </h3>
              <ul className="flex flex-col gap-2.5">
                {items.map(({ text, hash }, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="text-on-surface flex items-start gap-3 text-[14.5px] leading-[1.65]"
                  >
                    <span
                      className={cn('mt-2.5 size-1.5 shrink-0 rounded-full', dotClassFor(title))}
                    />
                    <span>
                      {text}
                      {hash && (
                        <span className="text-on-surface-muted bg-surface-container ml-2 rounded-[5px] px-1.5 py-px font-mono text-[11.5px] whitespace-nowrap">
                          {hash}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </article>
  );
};

export default ReleaseDetailBody;
