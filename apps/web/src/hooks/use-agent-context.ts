import { useAgentContext as useAgentContextLib } from '@copilotkit/react-core/v2';

import { joinLines } from '@/lib/text';
import { useReleaseDraftView } from './use-release-draft-view';

export const useAgentContext = () => {
  const view = useReleaseDraftView();

  useAgentContextLib({
    description: joinLines(
      'The release-notes draft currently shown in the Live Preview panel — the',
      'exact text an edit request applies to, and the text the Slack card will',
      'post. It may be an older draft the user reopened, not the newest one;',
      'edit this one. null means no draft has been generated yet. The title line is not',
      'part of these bodies: the app builds it from releaseDate/titleOverride.',
    ),
    value: { draft: view.draft },
  });
};
