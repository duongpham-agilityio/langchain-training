import { getFormatPresentation } from '@/lib/release-notes/format-presentation.ts';
import { getBrowserTimeZone } from '@/lib/time-zone.ts';
import type { ReleaseNotesDraft } from '../../types/release-notes-draft';
import type { ReleaseHistoryItem } from '../../types/release';

export const formatReleaseDate = (
  now: Date = new Date(),
  timeZone: string = getBrowserTimeZone(),
): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(now)
    .replaceAll('-', '');

export const parseReleaseDate = (releaseDate: string): Date => {
  const year = Number(releaseDate.slice(0, 4));
  const month = Number(releaseDate.slice(4, 6));
  const day = Number(releaseDate.slice(6, 8));
  return new Date(Date.UTC(year, month - 1, day, 12));
};

// A stored `YYYYMMDD` is a calendar day, parsed as UTC noon, so it is shown in
// UTC to read the same day for every viewer.
const STORED_DATE_TIME_ZONE = 'UTC';

const formatParsedReleaseDate = (
  releaseDate: string,
  options: Intl.DateTimeFormatOptions,
): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: STORED_DATE_TIME_ZONE, ...options }).format(
    parseReleaseDate(releaseDate),
  );

// "Sep 2, 2026"
export const formatReleaseDateDisplay = (
  releaseDate: string,
): string =>
  formatParsedReleaseDate(
    releaseDate,
    { year: 'numeric', month: 'short', day: 'numeric' },
  );

// "Sep 2"
export const formatReleaseShortDateDisplay = (
  releaseDate: string,
): string =>
  formatParsedReleaseDate(releaseDate, { month: 'short', day: 'numeric' });

// "September 2026"
export const formatReleaseMonthDisplay = (
  releaseDate: string,
): string =>
  formatParsedReleaseDate(releaseDate, { year: 'numeric', month: 'long' });

// "20260902-markdown.md", "20260902-json.json"; drafts without a date fall back to
// RELEASE_NOTES.<ext>. The extension follows the format.
export const buildReleaseNotesFileName = ({
  releaseDate,
  platform,
}: ReleaseNotesDraft): string => {
  const { extension } = getFormatPresentation(platform);
  return releaseDate
    ? `${releaseDate}-${platform}.${extension}`
    : `RELEASE_NOTES.${extension}`;
};

// "Sep 2, 2026 · GitHub", or just the label when the draft has no date.
export const describeReleaseDraft = ({ releaseDate, label }: ReleaseNotesDraft): string =>
  releaseDate ? `${formatReleaseDateDisplay(releaseDate)} · ${label}` : label;

const RELEASE_FORMAT_EXTENSIONS: Record<string, string> = {
  markdown: '.md',
  json: '.json',
  'html-email': '.html',
};

// "20260902-markdown.md" — the History twin of buildReleaseNotesFileName.
export const buildReleaseHistoryFileName = ({
  releaseDate,
  formatId,
}: ReleaseHistoryItem): string =>
  `${releaseDate}-${formatId}${RELEASE_FORMAT_EXTENSIONS[formatId] ?? '.txt'}`;

// "Sep 2, 2026 · GitHub"
export const describeReleaseHistoryItem = ({
  date,
  formatLabel,
}: ReleaseHistoryItem): string => `${date} · ${formatLabel}`;
