import { classificationRules } from "./classification-rules";
import { commitPrParsing } from "./commit-pr-parsing";
import { platformFormatting } from "./platform-formatting";
import { releaseReporting } from "./release-reporting";

export type Skill = {
  name: string;
  description: string;
  content: string;
};

// Content lives in TS modules (not .md files) so tsup bundles it into dist.
export const SKILLS = [
  commitPrParsing,
  classificationRules,
  platformFormatting,
  releaseReporting,
] as const satisfies readonly Skill[];

export type SkillName = (typeof SKILLS)[number]["name"];

export const SKILL_NAMES = SKILLS.map((skill) => skill.name) as [
  SkillName,
  ...SkillName[],
];
