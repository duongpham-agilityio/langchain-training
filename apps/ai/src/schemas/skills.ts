import { z } from "zod";

// Skills
import { SKILL_NAMES } from "@/skills";

export const loadSkillSchema = z.object({
  name: z.enum(SKILL_NAMES).describe("Name of the skill to load."),
});
