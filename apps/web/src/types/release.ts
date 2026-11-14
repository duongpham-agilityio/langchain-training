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

// One History row per archived release. Its text is rendered by the server in
// the format picked on the page (`formatId`), not stored.
export interface ReleaseHistoryItem {
  id: string;
  version: string;
  title: string;
  formatId: string;
  formatLabel: string;
  sendStatus: ReleaseSendStatus;
  // Raw `YYYYMMDD` — the display strings below can't be bucketed by recency.
  releaseDate: string;
  date: string;
  shortDate: string;
  monthLabel: string;
  // Null when the release is over the format's length limit.
  text: string | null;
}

export interface ReleaseHistoryGroup {
  label: string;
  items: ReleaseHistoryItem[];
}
