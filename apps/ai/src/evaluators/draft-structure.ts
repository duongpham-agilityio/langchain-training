// Constants
import {
  DRAFT_MARKDOWN_PLATFORMS,
  DRAFT_PLAIN_PLATFORM,
  DRAFT_SLACK_PLATFORM,
  EVALUATOR_KEYS,
} from "@/constants";

import type { Evaluator } from "./types";

const HEADING = /^#{1,6}\s/m;
const DASH_BULLET = /^\s*-\s+\S/m;
const DOT_BULLET = /^\s*•\s+\S/m;
const BOLD_SECTION = /^\*[^*\n]+\*\s*$/m;
const MARKUP = /(^#{1,6}\s)|\*\*|(^\s*[*•]\s)/m;

/** Draft follows the `platform-formatting` rules for the destination the user named. */
export const draftStructure: Evaluator = ({ draft }) => {
  if (!draft) return null;
  const { platform, content } = draft;
  const checks: { ok: boolean; problem: string }[] = [
    { ok: content.trim().length > 0, problem: "empty content" },
  ];

  if ((DRAFT_MARKDOWN_PLATFORMS as readonly string[]).includes(platform)) {
    checks.push(
      { ok: HEADING.test(content), problem: "no ## section heading" },
      { ok: DASH_BULLET.test(content), problem: "no - bullets" },
    );
  } else if (platform === DRAFT_SLACK_PLATFORM) {
    checks.push(
      { ok: !HEADING.test(content), problem: "Slack draft has # headings" },
      { ok: BOLD_SECTION.test(content), problem: "no *bold* section name" },
      { ok: DOT_BULLET.test(content), problem: "no • bullets" },
    );
  } else if (platform === DRAFT_PLAIN_PLATFORM) {
    checks.push({ ok: !MARKUP.test(content), problem: "plain text draft has markup" });
  }

  const failed = checks.filter((check) => !check.ok);
  return {
    key: EVALUATOR_KEYS.draftStructure,
    score: (checks.length - failed.length) / checks.length,
    comment: failed.length ? failed.map((check) => check.problem).join("; ") : `Structure ok for ${platform}`,
  };
};
