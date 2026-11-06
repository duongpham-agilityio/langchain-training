import { z } from 'zod';
import { joinLines } from '../lib/text';

export const enum ReleaseSectionType {
  Breaking = 'breaking',
  Feature = 'feature',
  Fix = 'fix',
}

export const enum ExcludedCommitType {
  Chore = 'chore',
  Docs = 'docs',
  Refactor = 'refactor',
  Test = 'test',
}

export const WorkingMemorySchema = z.object({
  platform: z
    .string()
    .optional()
    .describe(
      joinLines(
        'The platform the user is currently building release notes for:',
        '"github", "app-store", "google-play", or a custom platform id (e.g.',
        '"slack", "changelog"). Update it whenever the user switches platform',
        'so drafts default to it without asking again.',
      ),
    ),
  currentRelease: z
    .object({
      version: z.string().min(1),
      title: z.string().min(1),
    })
    .nullish()
    .describe(
      joinLines(
        'The release currently being iterated on in this conversation — the',
        'last version/title you produced. Read it before drafting to decide',
        'whether this build continues that release (bump the version) or starts',
        'a different one (reset to "1.0.0", new title). Update it after every',
        'draft/edit call that includes version/title. Set it explicitly to null',
        '(not omitted) when the user starts a build for a clearly different set',
        'of commits/PRs, to signal "no release in progress" rather than leaving',
        'the previous one in place.',
      ),
    ),
  language: z
    .string()
    .optional()
    .describe(
      joinLines(
        'The natural language the user wants to be addressed in during chat',
        '(e.g. "English", "Vietnamese"), inferred from the language they write',
        'in or an explicit request. This governs conversational replies only —',
        'release-notes body text still follows the per-platform formatting',
        'rules regardless of this setting.',
      ),
    ),
  buildOrdering: z
    .object({
      sectionOrder: z
        .array(
          z.enum([
            ReleaseSectionType.Breaking,
            ReleaseSectionType.Feature,
            ReleaseSectionType.Fix,
          ]),
        )
        .optional()
        .describe(
          joinLines(
            'Custom section order for release notes, overriding the default',
            'Breaking > Feature > Fix. Only set this when the user explicitly',
            'asks for a different order (e.g. "put fixes before features").',
            'Omit to use the default order.',
          ),
        ),
      keepExcludedTypes: z
        .array(
          z.enum([
            ExcludedCommitType.Chore,
            ExcludedCommitType.Docs,
            ExcludedCommitType.Refactor,
            ExcludedCommitType.Test,
          ]),
        )
        .optional()
        .describe(
          joinLines(
            'Normally-excluded commit types the user wants kept in release',
            'notes instead of filtered out (e.g. keep "docs:" commits visible).',
            'Omit to keep the default exclusion of chore/docs/refactor/test.',
          ),
        ),
    })
    .optional()
    .describe(
      joinLines(
        "The user's personal build template, overriding the app's default",
        'ordering/inclusion rules. Only set fields the user explicitly asked',
        'to customize.',
      ),
    ),
});

export type WorkingMemory = z.infer<typeof WorkingMemorySchema>;
