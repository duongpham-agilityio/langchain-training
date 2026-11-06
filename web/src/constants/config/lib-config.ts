import { KnownPlatformId } from '../../types/platform';

export const MASTRA_CORS_CONFIG = {
  origin: '*',
  allowMethods: ['*'],
  allowHeaders: ['*'],
};

export const MASTRA_LOGGER_NAME = 'Mastra';

export const MASTRA_OBSERVABILITY_SERVICE_NAME = 'mastra';

export const RELEASE_NOTES_TITLE_PREFIX = 'Release Notes - #';

export const APP_STORE_CHARACTER_LIMIT = 4000;

export const GOOGLE_PLAY_CHARACTER_LIMIT = 500;

export const RELEASE_TITLE_CHARACTER_BUDGET = 60;

// Repo-owned limits for dynamic platforms — always wins over a model-declared
// characterLimit so a fabricated "no limit" claim can't bypass validation.
export const PLATFORM_CHARACTER_LIMITS: Record<string, number> = {
  [KnownPlatformId.AppStore]: APP_STORE_CHARACTER_LIMIT,
  [KnownPlatformId.GooglePlay]: GOOGLE_PLAY_CHARACTER_LIMIT,
  'x-twitter': 280,
  slack: 3000,
};
