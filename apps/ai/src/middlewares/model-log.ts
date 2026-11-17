import { createMiddleware } from "langchain";

/**
 * Logs the model name the chat model instance holds, once, where it is handed to `createAgent`, and
 * returns the instance unchanged. This is the value the agent really uses (after any default).
 */
export const logAgentModel = <T extends { model: string }>(model: T): T => {
  console.log(`[ai] createAgent model: ${model.model}`);
  return model;
};

/**
 * Logs which model really answered each model call. The configured model (`AI_MODEL`) is logged at
 * startup, but `modelFallbackMiddleware` can switch to `AI_FALLBACK_MODEL` for a single call, and only
 * the response says which one answered. It is registered before the fallback middleware so it sees
 * the final result. Logs the model name and the tool names only: never message text or arguments.
 */
export const createModelLogMiddleware = () =>
  createMiddleware({
    name: "ModelLogMiddleware",
    wrapModelCall: async (request, handler) => {
      const startedAt = Date.now();
      const response = await handler(request);
      const metadata = (response as { response_metadata?: Record<string, unknown> }).response_metadata;
      const model = metadata?.model_name ?? metadata?.model ?? "unknown";
      const toolCalls = (response as { tool_calls?: Array<{ name: string }> }).tool_calls ?? [];
      console.log(
        `[ai] model call: ${String(model)} in ${Date.now() - startedAt} ms` +
          (toolCalls.length ? `, tools: ${toolCalls.map((call) => call.name).join(", ")}` : ""),
      );
      return response;
    },
  });
