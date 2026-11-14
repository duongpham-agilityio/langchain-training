import type { ChangelogEntry } from '@training/contracts';
import Badge, { BadgeVariant } from '@/components/common/Badge.tsx';
import { CHANGE_TYPE_LABELS } from '@/constants/changelog.ts';
import { groupChangesByType } from '@/lib/release-notes/group-changes-by-type.ts';
import {
  formatReleaseDateDisplay,
  formatReleaseVersion,
} from '@/lib/release-notes/release-title.ts';

interface ChangelogReleaseProps {
  entry: ChangelogEntry;
}

const ChangelogRelease = ({ entry }: ChangelogReleaseProps) => {
  const { version, date, changes, sent } = entry;

  return (
    <li className="border-outline-subtle relative flex flex-col gap-3 border-l-2 pb-8 pl-6 last:pb-0">
      <span className="bg-primary border-surface absolute top-1.5 -left-[7px] size-3 rounded-full border-2" />
      <header className="flex flex-wrap items-center gap-2.5">
        <h2 className="text-on-surface text-[17px] font-bold tabular-nums">
          {formatReleaseVersion(version)}
        </h2>
        <span className="text-label-sm text-on-surface-muted">
          {formatReleaseDateDisplay(date)}
        </span>
        <Badge variant={sent ? BadgeVariant.Success : BadgeVariant.Neutral}>
          {sent ? 'Sent' : 'Not sent'}
        </Badge>
      </header>

      {changes.length === 0 ? (
        <p className="text-body-sm text-on-surface-muted">No changes recorded.</p>
      ) : (
        groupChangesByType(changes).map(({ type, changes: typeChanges }) => (
          <section key={type} aria-label={CHANGE_TYPE_LABELS[type]}>
            <h3 className="text-label-xs text-on-surface-muted mb-1.5 font-semibold tracking-wide uppercase">
              {CHANGE_TYPE_LABELS[type]}
            </h3>
            <ul className="flex flex-col gap-1.5">
              {typeChanges.map((change) => (
                <li
                  key={change.id}
                  className="text-body-md text-on-surface flex items-start gap-2"
                >
                  <span className="bg-outline mt-2 size-1 shrink-0 rounded-full" />
                  <span className="min-w-0">
                    {change.description}
                    {change.breaking && (
                      <span className="ml-2 align-middle">
                        <Badge variant={BadgeVariant.Error}>Breaking</Badge>
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </li>
  );
};

export default ChangelogRelease;
