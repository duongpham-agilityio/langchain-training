import { tool } from "langchain";

// Constants
import { LOAD_SKILL_DESCRIPTION, LOAD_SKILL_TOOL_NAME } from "@/constants";

// Schemas
import { loadSkillSchema } from "@/schemas";

// Skills
import { SKILL_NAMES, SKILLS } from "@/skills";

export const loadSkill = tool(
  async ({ name }) => {
    const skill = SKILLS.find((item) => item.name === name);
    // The schema enum blocks unknown names; this keeps the tool safe if called directly.
    return skill
      ? skill.content
      : `Unknown skill "${name}". Available: ${SKILL_NAMES.join(", ")}.`;
  },
  {
    name: LOAD_SKILL_TOOL_NAME,
    description: LOAD_SKILL_DESCRIPTION,
    schema: loadSkillSchema,
  },
);
