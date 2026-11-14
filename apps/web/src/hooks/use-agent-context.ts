import { useAgentContext as useAgentContextLib } from '@copilotkit/react-core/v2';
import type { DraftContext } from '@training/contracts';

import { joinLines } from '@/lib/text';
import { useReleaseDraftView } from './use-release-draft-view';

export const useAgentContext = () => {
  const view = useReleaseDraftView();
  const draft = view.draft;

  // The same shape the server reads (`DraftContextSchema` in `@training/contracts`): the release object of the draft
  // on screen, so an edit request on a reopened draft is built from that draft, not the newest.
  // null while there is no draft, or for one saved before `release` was carried along.
  const value: DraftContext | null =
    draft?.release && draft.hash && !draft.renderError
      ? {
          release: draft.release,
          format: draft.platform,
          text: draft.content,
          hash: draft.hash,
        }
      : null;

  useAgentContextLib({
    description: joinLines(
      'The release-notes draft currently shown in the Live Preview panel — the',
      'release object and the rendered text of one format, which an edit request',
      'applies to. It may be an older draft the user reopened, not the newest one;',
      'edit this one. null means no draft has been generated yet.',
    ),
    value,
  });
};
