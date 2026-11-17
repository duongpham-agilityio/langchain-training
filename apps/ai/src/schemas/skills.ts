import { z } from "zod";

// Skills
import { SKILL_NAMES } from "@/skills";

// One call loads every skill the model needs. Parallel `load_skill` calls arrived with empty
// arguments on some providers (the calls' stream chunks share one index), and a schema error for a
// missing value only made the model retry, so `names` has a default and the tool answers an empty
// call with the list of skills instead of throwing.
export const loadSkillSchema = z.object({
  names: z
    .array(z.enum(SKILL_NAMES))
    .default([])
    .describe("Names of all the skills to load, in one call."),
});
