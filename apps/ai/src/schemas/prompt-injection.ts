import { z } from "zod";

// Constants
import { PROMPT_INJECTION_VERDICTS } from "@/constants";

export const PromptInjectionVerdictSchema = z.object({
  verdict: z.enum(PROMPT_INJECTION_VERDICTS),
});
