import { formatReleaseDate, parseReleaseDate } from '@/lib/release-notes/release-title.ts';
import type { ReleaseHistoryGroup, ReleaseHistoryItem } from '@/types/release.ts';

export const enum ReleaseHistoryBucket {
  Today = 'Today',
  Last7Days = 'Last 7 days',
}

const DAY_MS = 24 * 60 * 60 * 1000;
const LAST_7_DAYS_MAX_DIFF = 7;

// Whole days between two `YYYYMMDD` dates. Both parse to UTC noon, so the
// difference is an exact multiple of a day with no DST drift.
const dayDiffFromToday = (today: string, releaseDate: string): number =>
  Math.round((parseReleaseDate(today).getTime() - parseReleaseDate(releaseDate).getTime()) / DAY_MS);

const labelFor = ({ releaseDate, monthLabel }: ReleaseHistoryItem, today: string): string => {
  const dayDiff = dayDiffFromToday(today, releaseDate);
  if (dayDiff <= 0) return ReleaseHistoryBucket.Today;
  if (dayDiff <= LAST_7_DAYS_MAX_DIFF) return ReleaseHistoryBucket.Last7Days;
  return monthLabel;
};

// Items arrive newest first, so bucket labels are monotone: Today, then
// Last 7 days, then one run per month. Consecutive runs of the same label are
// exactly the sections — no re-sorting here. "Today" is read in the release
// time zone (same one the stored dates use), not the browser's.
export const groupReleaseHistoryByRecency = (
  items: ReleaseHistoryItem[],
  now: Date = new Date(),
): ReleaseHistoryGroup[] => {
  const today = formatReleaseDate(now);

  return items.reduce<ReleaseHistoryGroup[]>((groups, item) => {
    const label = labelFor(item, today);
    const lastGroup = groups.at(-1);
    if (lastGroup?.label === label) {
      lastGroup.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
    return groups;
  }, []);
};
