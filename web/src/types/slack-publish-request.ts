import { z } from 'zod';
import { joinLines } from '../lib/text';

const MAX_CONTENT_LENGTH = 35_000;

export const SlackPublishRequestSchema = z.object({
  platformId: z
    .string()
    .min(1)
    .describe('The `platform` value of the draft currently shown — the same identifier.'),
  label: z
    .string()
    .min(1)
    .describe(
      joinLines(
        'The `label` of the draft currently shown, denoting the same',
        'destination as platformId.',
      ),
    ),
  content: z
    .string()
    .min(1)
    .max(MAX_CONTENT_LENGTH)
    .describe('The exact rendered body of the draft currently shown — never different text.'),
});

export type SlackPublishRequest = z.infer<typeof SlackPublishRequestSchema>;
