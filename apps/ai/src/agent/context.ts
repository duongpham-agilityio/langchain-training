import { z } from "zod";

/**
 * Per-run context of the agent: the verified user and the browser time zone, resolved once in
 * `ReleaseNotesAguiAgent.run` and passed with `agent.stream(..., { context })`. Tools and middlewares
 * read it from the LangChain runtime (`runtime.context`), never from the model's arguments.
 * `projectId` is optional and unused until #166.
 */
export const contextSchema = z.object({
  userId: z.string(),
  timeZone: z.string(),
  projectId: z.string().optional(),
});

export type AgentContext = z.infer<typeof contextSchema>;

/** Reads the run context from a LangChain runtime; undefined when the run carried none (or an invalid one). */
export const readAgentContext = (runtime: { context?: unknown } | undefined): AgentContext | undefined => {
  const parsed = contextSchema.safeParse(runtime?.context);
  return parsed.success ? parsed.data : undefined;
};
