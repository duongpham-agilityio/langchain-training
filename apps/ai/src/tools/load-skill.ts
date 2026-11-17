import { tool } from "langchain";

// Constants
import { LOAD_SKILL_DESCRIPTION, LOAD_SKILL_TOOL_NAME } from "@/constants";

// Schemas
import { loadSkillSchema } from "@/schemas";

// Skills
import { SKILL_NAMES, SKILLS } from "@/skills";

export const loadSkill = tool(
  async ({ names }) => {
    // An empty call (no names) is answered with the list, so the model can call again correctly.
    if (names.length === 0) {
      return `No skill name given. Call load_skill once with names from: ${SKILL_NAMES.join(", ")}.`;
    }
    // The schema enum blocks unknown names; this keeps the tool safe if called directly.
    return [...new Set(names)]
      .map((name) => SKILLS.find((item) => item.name === name)?.content ?? `Unknown skill "${name}". Available: ${SKILL_NAMES.join(", ")}.`)
      .join("\n\n---\n\n");
  },
  {
    name: LOAD_SKILL_TOOL_NAME,
    description: LOAD_SKILL_DESCRIPTION,
    schema: loadSkillSchema,
  },
);
