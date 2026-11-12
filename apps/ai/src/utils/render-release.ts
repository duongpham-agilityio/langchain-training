// Constants
import {
  CHANGE_TYPES,
  RELEASE_BREAKING_LABEL,
  RELEASE_CHANGE_TYPE_LABELS,
  RELEASE_FORMAT_LABELS,
  RELEASE_FORMAT_LIMITS,
  type ReleaseFormat,
} from "@/constants";

// Schemas
import type { Change, Release } from "@/schemas";

// Utils
import { renderReleaseEmail } from "./render-release-email";

export type RenderReleaseResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

type ChangeGroup = { label: string; changes: Change[] };

/** Groups changes under their type heading, in `CHANGE_TYPES` order; empty groups are dropped. */
const groupByType = (changes: Change[]): ChangeGroup[] =>
  CHANGE_TYPES.map((type) => ({
    label: RELEASE_CHANGE_TYPE_LABELS[type],
    changes: changes.filter((change) => change.type === type),
  })).filter((group) => group.changes.length > 0);

const markdownItem = (change: Change): string =>
  change.breaking
    ? `**${RELEASE_BREAKING_LABEL}:** ${change.description}`
    : change.description;

const slackItem = (change: Change): string =>
  change.breaking
    ? `*${RELEASE_BREAKING_LABEL}:* ${change.description}`
    : change.description;

const plainItem = (change: Change): string =>
  change.breaking
    ? `${RELEASE_BREAKING_LABEL}: ${change.description}`
    : change.description;

// Refs (PR numbers, commit hashes) are never written here: only the JSON output carries them.
const renderMarkdown = (release: Release): string =>
  [
    `# ${release.version} (${release.date})`,
    release.openingLine,
    ...groupByType(release.changes).map((group) =>
      [
        `## ${group.label}`,
        ...group.changes.map((change) => `- ${markdownItem(change)}`),
      ].join("\n"),
    ),
  ].join("\n\n");

const renderSlack = (release: Release): string =>
  [
    `*${release.version} (${release.date})*`,
    release.openingLine,
    ...groupByType(release.changes).map((group) =>
      [
        `*${group.label}*`,
        ...group.changes.map((change) => `• ${slackItem(change)}`),
      ].join("\n"),
    ),
  ].join("\n\n");

// Store text is plain: no markup, so it is safe to paste into App Store and Google Play fields.
const renderPlainText = (release: Release): string =>
  [
    `${release.version} (${release.date})`,
    release.openingLine,
    ...groupByType(release.changes).map((group) =>
      [
        `${group.label}:`,
        ...group.changes.map((change) => `- ${plainItem(change)}`),
      ].join("\n"),
    ),
  ].join("\n\n");

const RENDERERS: Record<ReleaseFormat, (release: Release) => string> = {
  markdown: renderMarkdown,
  slack: renderSlack,
  "app-store": renderPlainText,
  "google-play": renderPlainText,
  json: (release) => JSON.stringify(release),
  "html-email": (release) => renderReleaseEmail(release).html,
};

/** Counts code points, so an emoji or accented letter counts as one character. */
const countCharacters = (text: string): number => [...text].length;

/**
 * Renders one release for a destination. Pure: no LLM, no I/O.
 * Never truncates: over-limit text is an error with no text, so a partial post cannot reach a store or Slack.
 */
export const renderRelease = (
  release: Release,
  format: ReleaseFormat,
): RenderReleaseResult => {
  const text = RENDERERS[format](release);
  const limit = RELEASE_FORMAT_LIMITS[format];

  if (limit !== undefined && countCharacters(text) > limit) {
    return {
      ok: false,
      error: `${RELEASE_FORMAT_LABELS[format]} text is ${countCharacters(text)} characters; the limit is ${limit}. Shorten the release notes.`,
    };
  }

  return { ok: true, text };
};
