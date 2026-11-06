import { useConfigureSuggestions } from '@copilotkit/react-core/v2';
import { RELEASE_COPILOT_AGENT_ID } from '@/constants/agent-tools/agent-id.ts';
import type { ReleaseNotesDraft } from '@/types/release-notes-draft.ts';

const SEND_TO_SLACK_SUGGESTION = {
  title: 'Send to Slack',
  message: 'Send the current release notes to Slack.',
};

// Offers the "Send to Slack" pill once a draft exists — SINGLE CALL SITE, see
// DashboardPage.tsx. Clicking it sends that message like any other, and the
// agent decides whether to call the publish-release-notes-to-slack tool.
//
// Deliberately static, not a `instructions`-driven dynamic config: a dynamic
// one makes CopilotKit clone the agent and run it for real to write the pill
// text, and under `mode: 'single-route'` that run always takes the
// thread-persisting path — one throwaway thread per page load, each holding
// CopilotKit's internal prompt as a visible user message.
//
// consumerAgentId is required here: this hook runs outside the chat's
// configuration provider, so without it the suggestion is filed under the
// "default" agent and the sidebar never reads it.
//
// available must be set too — static configs default to
// "before-first-message", which is never true by the time a draft exists.
export const useSlackSuggestion = (draft: ReleaseNotesDraft | null): void => {
  useConfigureSuggestions(
    draft
      ? {
          suggestions: [SEND_TO_SLACK_SUGGESTION],
          consumerAgentId: RELEASE_COPILOT_AGENT_ID,
          available: 'after-first-message',
        }
      : null,
    [Boolean(draft)],
  );
};
