import { createMiddleware } from "langchain";

// Constants
import { SKILLS_PROMPT_HEADER } from "@/constants";

// Skills
import { SKILLS } from "@/skills";

// Tools
import { loadSkill } from "@/tools/load-skill";

const SKILLS_CATALOG = [
  SKILLS_PROMPT_HEADER,
  ...SKILLS.map((skill) => `- ${skill.name}: ${skill.description}`),
].join("\n");

/**
 * Progressive disclosure: every turn carries only the short catalog; a skill's
 * full text enters the conversation only when the model calls `load_skill`.
 * The tool ships with the middleware so `tools/index.ts` stays untouched.
 */
export const skillsMiddleware = createMiddleware({
  name: "SkillsMiddleware",
  tools: [loadSkill],
  wrapModelCall: (request, handler) =>
    handler({
      ...request,
      systemMessage: request.systemMessage.concat(`\n\n${SKILLS_CATALOG}`),
    }),
});
