export const LOAD_SKILL_TOOL_NAME = "load_skill";

export const LOAD_SKILL_DESCRIPTION =
  "Load the full rules of one or more skills by name. Call it once with every skill you need, before doing the task the skills cover.";

export const SKILLS_PROMPT_HEADER = [
  "## Skills",
  "Detailed rules live in skills that are not loaded by default.",
  "Call `load_skill` once, with the names of all the skills a task needs, before that task.",
  "Do not load a skill for greetings or small talk.",
  "Available skills:",
].join("\n");
