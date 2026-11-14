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

const DEFAULT_RELEASE_NOTES_FILE_NAME = 'RELEASE_NOTES.md';

// "v2.4.0-github.md"; drafts without a version fall back to RELEASE_NOTES.md.
export const buildReleaseNotesFileName = ({
  version,
  platform,
}: ReleaseNotesDraft): string =>
  version ? `v${version}-${platform}.md` : DEFAULT_RELEASE_NOTES_FILE_NAME;

// "v2.4.0 · GitHub", or just the label when the draft has no version.
export const describeReleaseDraft = ({ version, label }: ReleaseNotesDraft): string =>
  version ? `v${version} · ${label}` : label;

// "2.4.0" -> "v2.4.0". Drafts carry a bare MAJOR.MINOR.PATCH, so History
// prefixes it once on the way in; already-prefixed values pass through.
export const formatReleaseVersion = (version: string): string =>
  version.startsWith('v') ? version : `v${version}`;

const RELEASE_FORMAT_EXTENSIONS: Record<string, string> = {
  markdown: '.md',
  json: '.json',
  'html-email': '.html',
};

// "v2.4.0-markdown.md" — the History twin of buildReleaseNotesFileName, whose
// version is already display-formatted.
export const buildReleaseHistoryFileName = ({
  version,
  formatId,
}: ReleaseHistoryItem): string =>
  `${version}-${formatId}${RELEASE_FORMAT_EXTENSIONS[formatId] ?? '.txt'}`;

// "v2.4.0 · GitHub"
export const describeReleaseHistoryItem = ({
  version,
  formatLabel,
}: ReleaseHistoryItem): string => `${version} · ${formatLabel}`;
