import { TOOL_NAMES } from '@training/contracts';

// Tools the chat draws something for: the ones registered with `useRenderTool`
// (hooks/use-release-draft.tsx). Every other tool call (load_skill, getChangelog, the memory tools,
// the approval tools, which have their own interrupt cards) draws nothing, so an assistant message
// that only holds such calls would be an empty row with action buttons. Add a name here when a new
// `useRenderTool` is registered.
export const RENDERED_TOOL_NAMES: ReadonlySet<string> = new Set([
  TOOL_NAMES.renderReleaseNotesPreview,
  TOOL_NAMES.editReleaseItem,
  TOOL_NAMES.showChangelogAnswer,
]);
