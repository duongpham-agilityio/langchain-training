export const enum ReleaseStatus {
  Published = 'published',
  Draft = 'draft',
  Archived = 'archived',
}

export const enum ReleaseSendStatus {
  Sent = 'sent',
  NotSent = 'not-sent',
}

export const enum ReleaseHistoryFilter {
  All = 'all',
  Sent = 'sent',
  NotSent = 'not-sent',
}

// One History row: a single (version, platform) pair, not a whole release —
// the design lists "v2.4.0 · GitHub" and "v2.4.0 · App Store" separately.
export interface ReleaseHistoryItem {
  // `${releaseId}:${platformId}` — React key and list selection only; every
  // action needs the two ids on their own, so they are stored, not re-split.
  id: string;
  releaseId: string;
  version: string;
  title: string;
  platformId: string;
  platformLabel: string;
  sendStatus: ReleaseSendStatus;
  // Raw `YYYYMMDD` — the display strings below can't be bucketed by recency.
  releaseDate: string;
  date: string;
  shortDate: string;
  monthLabel: string;
  markdown: string;
}

export interface ReleaseHistoryGroup {
  label: string;
  items: ReleaseHistoryItem[];
}
