/** LangSmith feedback keys, one per answer-quality check. */
export const EVALUATOR_KEYS = {
  countSummaryFormat: "count_summary_format",
  draftStructure: "draft_structure",
  groundedItems: "grounded_items",
} as const;

/** Shown in LangSmith as the origin of the feedback. */
export const EVALUATOR_FEEDBACK_SOURCE = "answer-quality-evaluators";

/** A score below this is logged server-side as a failing check (never shown to the user). */
export const EVALUATOR_PASS_THRESHOLD = 0.8;

/** Type lines in `release-reporting` order; the summary lists a type only when it is not 0. */
export const COUNT_SUMMARY_CLASSES = [
  "Features",
  "Fixes",
  "Performance",
  "Docs",
  "Internal",
  "Other",
] as const;
export const COUNT_SUMMARY_TOTAL_LABEL = "Total";
/** Flag line outside the Total; shown only when above 0. */
export const COUNT_SUMMARY_BREAKING_LABEL = "Breaking";

/** A pasted git log / PR list spans several lines; shorter input is not a summary turn. */
export const COUNT_SUMMARY_MIN_INPUT_LINES = 2;

/** Destinations with a documented format in `platform-formatting`. */
export const DRAFT_MARKDOWN_PLATFORMS = ["markdown", "github"] as const;
export const DRAFT_SLACK_PLATFORM = "slack";
export const DRAFT_PLAIN_PLATFORM = "plain-text";

/** `#123` references and 7+ char hex commit hashes. */
export const REFERENCE_PATTERN = /#\d+|\b[0-9a-f]{7,40}\b/gi;
