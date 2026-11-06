import type { ThreadSummary } from '@/types/thread.ts';

export const enum ThreadDateBucket {
  Today = 'Today',
  Yesterday = 'Yesterday',
  Previous30Days = 'Previous 30 days',
}

export interface ThreadWithTimeLabel extends ThreadSummary {
  timeLabel: string;
}

export interface ThreadGroup {
  label: ThreadDateBucket;
  threads: ThreadWithTimeLabel[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const bucketFor = (updatedAt: string, startOfToday: number): ThreadDateBucket => {
  const dayDiff = Math.floor((startOfToday - startOfDay(new Date(updatedAt))) / DAY_MS);
  if (dayDiff <= 0) return ThreadDateBucket.Today;
  if (dayDiff === 1) return ThreadDateBucket.Yesterday;
  return ThreadDateBucket.Previous30Days;
};

const timeLabelFor = (updatedAt: string, bucket: ThreadDateBucket): string => {
  const date = new Date(updatedAt);

  if (bucket === ThreadDateBucket.Today) {
    const diffMs = Date.now() - date.getTime();
    const hours = Math.floor(diffMs / HOUR_MS);
    return hours < 1 ? `${Math.max(1, Math.floor(diffMs / MINUTE_MS))}m` : `${hours}h`;
  }
  if (bucket === ThreadDateBucket.Yesterday) return WEEKDAY_NAMES[date.getDay()];
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
};

const BUCKET_ORDER = [
  ThreadDateBucket.Today,
  ThreadDateBucket.Yesterday,
  ThreadDateBucket.Previous30Days,
];

// Buckets sidebar threads the way the design groups them — Today / Yesterday /
// Previous 30 days, newest first within each bucket — and attaches the
// per-row time label (design shows "2h" in Today, a weekday in Yesterday,
// "Aug 26" beyond that) instead of a generic "Xh ago" relative timestamp.
export const groupThreadsByRecency = (threads: ThreadSummary[]): ThreadGroup[] => {
  const startOfToday = startOfDay(new Date());
  const buckets = new Map<ThreadDateBucket, ThreadWithTimeLabel[]>();

  for (const thread of threads) {
    const bucket = bucketFor(thread.updatedAt, startOfToday);
    const items = buckets.get(bucket) ?? [];
    items.push({ ...thread, timeLabel: timeLabelFor(thread.updatedAt, bucket) });
    buckets.set(bucket, items);
  }

  return BUCKET_ORDER.map((label) => ({ label, threads: buckets.get(label) ?? [] })).filter(
    (group) => group.threads.length > 0,
  );
};
