/**
 * Switches LangSmith tracing on only when an API key is set, off otherwise.
 * LangChain reads these env vars on every run, so one call at startup covers model, tool and graph runs.
 * An empty key must mean "off" even if a stray `LANGSMITH_TRACING=true` is exported in the shell.
 */
export const configureTracing = (langsmith: { apiKey?: string; project?: string }): boolean => {
  const enabled = Boolean(langsmith.apiKey);
  process.env.LANGSMITH_TRACING = String(enabled);
  // Legacy name, still read by older LangChain code paths.
  process.env.LANGCHAIN_TRACING_V2 = String(enabled);
  if (enabled && langsmith.project) process.env.LANGSMITH_PROJECT = langsmith.project;
  return enabled;
};
