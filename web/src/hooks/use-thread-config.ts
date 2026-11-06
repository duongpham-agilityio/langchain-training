import {
  useCopilotChatConfiguration,
  type CopilotChatConfigurationValue,
} from '@copilotkit/react-core/v2';

// The active thread id, owned by the <CopilotChatConfigurationProvider> that
// <CopilotKit> renders around its children (AppProviders).
//
// `useCopilotChatConfiguration()` returns null outside that provider, which
// silently turns every thread hook into dead code — a `?? {}` at the call site
// compiles fine and then never runs. Throw instead, so a component mounted
// outside <CopilotKit> fails loudly.
export const useThreadConfig = (): CopilotChatConfigurationValue => {
  const config = useCopilotChatConfiguration();

  if (!config) {
    throw new Error(
      'useThreadConfig: no <CopilotChatConfigurationProvider> in scope — the component must be rendered inside <CopilotKit> (see AppProviders).',
    );
  }

  return config;
};
