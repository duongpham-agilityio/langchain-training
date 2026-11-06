const requireModelEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

export const RELEASE_COPILOT_MODEL = requireModelEnv('RELEASE_COPILOT_MODEL');

export const RELEASE_COPILOT_FALLBACK_MODEL = requireModelEnv(
  'RELEASE_COPILOT_FALLBACK_MODEL',
);

export const RELEASE_COPILOT_GUARDRAIL_MODEL = requireModelEnv(
  'RELEASE_COPILOT_GUARDRAIL_MODEL',
);

export const RELEASE_COPILOT_JUDGE_MODEL = requireModelEnv(
  'RELEASE_COPILOT_JUDGE_MODEL',
);

export const RELEASE_COPILOT_EMBEDDING_MODEL = requireModelEnv(
  'RELEASE_COPILOT_EMBEDDING_MODEL',
);
