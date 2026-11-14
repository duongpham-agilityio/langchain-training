import { RELEASE_FORMATS, type ReleaseFormat } from '@training/contracts';

// How the Live Preview shows a rendered format, and what a download of it is.
// `preview` is how the Preview tab draws the text; Source always shows it raw.
export const enum PreviewKind {
  Markdown = 'markdown',
  Html = 'html',
  Text = 'text',
}

export interface FormatPresentation {
  preview: PreviewKind;
  extension: string;
  mimeType: string;
}

const PRESENTATIONS: Record<ReleaseFormat, FormatPresentation> = {
  markdown: {
    preview: PreviewKind.Markdown,
    extension: 'md',
    mimeType: 'text/markdown',
  },
  // Slack mrkdwn, App Store and Google Play text are not CommonMark: shown as-is.
  slack: {
    preview: PreviewKind.Text,
    extension: 'txt',
    mimeType: 'text/plain',
  },
  'app-store': {
    preview: PreviewKind.Text,
    extension: 'txt',
    mimeType: 'text/plain',
  },
  'google-play': {
    preview: PreviewKind.Text,
    extension: 'txt',
    mimeType: 'text/plain',
  },
  json: {
    preview: PreviewKind.Text,
    extension: 'json',
    mimeType: 'application/json',
  },
  'html-email': {
    preview: PreviewKind.Html,
    extension: 'html',
    mimeType: 'text/html',
  },
};

const FALLBACK: FormatPresentation = {
  preview: PreviewKind.Text,
  extension: 'txt',
  mimeType: 'text/plain',
};

const isReleaseFormat = (id: string): id is ReleaseFormat =>
  (RELEASE_FORMATS as readonly string[]).includes(id);

// An unknown id (e.g. an older stored draft) is plain text.
export const getFormatPresentation = (formatId: string): FormatPresentation =>
  isReleaseFormat(formatId) ? PRESENTATIONS[formatId] : FALLBACK;
