import { tool } from "langchain";

// Constants
import { TOOL_NAMES } from "../constants";

// Schemas
import { getCurrentTimeSchema } from "../schemas";

const GET_CURRENT_TIME_DESCRIPTION =
  "Get the current server time in ISO 8601 format.";

export const getCurrentTime = tool(async () => new Date().toISOString(), {
  name: TOOL_NAMES.getCurrentTime,
  description: GET_CURRENT_TIME_DESCRIPTION,
  schema: getCurrentTimeSchema,
});
