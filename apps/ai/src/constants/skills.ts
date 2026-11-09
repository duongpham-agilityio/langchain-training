export const LOAD_SKILL_TOOL_NAME = "load_skill";

export const LOAD_SKILL_DESCRIPTION =
  "Load the full rules of one skill by name. Call it before doing the task the skill covers.";

export const SKILLS_PROMPT_HEADER = [
  "## Skills",
  "Detailed rules live in skills that are not loaded by default.",
  "Call `load_skill` with the skill name before a task that needs it.",
  "Do not load a skill for greetings or small talk.",
  "Available skills:",
].join("\n");
