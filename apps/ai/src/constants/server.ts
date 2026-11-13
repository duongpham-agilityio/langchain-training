import { TIME_ZONE_HEADER } from "@training/contracts";

export { RELEASE_COPILOT_AGENT_ID, RUNTIME_BASE_PATH, TIME_ZONE_HEADER } from "@training/contracts";

export const DEFAULT_PORT = 4000;
export const DEFAULT_CORS_ORIGIN = "http://localhost:5173";
export const CORS_ALLOWED_HEADERS = ["Authorization", "Content-Type", TIME_ZONE_HEADER];
export const API_PATH_PATTERN = "/api/*";
export const BEARER_PREFIX = "Bearer ";
