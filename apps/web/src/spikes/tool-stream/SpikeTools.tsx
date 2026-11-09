import { useFrontendTool, useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// SPIKE (M-04, throwaway). Same card for both routes; it renders whatever
// partial args have arrived so far, so growth is visible while the call streams.
const PreviewSchema = z.object({
  version: z.string().optional(),
  title: z.string().optional(),
  platform: z.string().optional(),
  label: z.string().optional(),
  content: z.string().optional(),
});
const TOOL = 'renderReleaseNotesPreview';

const Card = ({ status, args }: { status: string; args: Record<string, unknown> }) => (
  <div data-testid="spike-card" data-status={status} style={{ border: '1px solid #888', borderRadius: 8, padding: 12, maxWidth: 420, fontFamily: 'sans-serif' }}>
    <div data-testid="card-status" style={{ fontSize: 11, color: '#666' }}>{status}</div>
    <strong data-testid="card-title">
      {String(args.title ?? '…')} {args.version ? `· v${String(args.version)}` : ''}
    </strong>
    <div data-testid="card-platform">{String(args.label ?? '')}</div>
    <pre data-testid="card-content" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{String(args.content ?? '')}</pre>
  </div>
);

/** Route A: the browser owns the tool (handler answers the call). */
export const FrontendToolRoute = () => {
  useFrontendTool({
    name: TOOL,
    description: 'Render the release notes preview card.',
    parameters: PreviewSchema,
    handler: async () => 'rendered',
    render: (props) => <Card status={props.status} args={(props.args ?? {}) as Record<string, unknown>} />,
  });
  return null;
};

/** Route B: the server owns the tool; the browser only renders it. */
export const ForwardingRoute = () => {
  useRenderTool({
    name: TOOL,
    parameters: PreviewSchema,
    agentId: 'spikeForwarding',
    render: (props) => <Card status={props.status} args={(props.parameters ?? {}) as Record<string, unknown>} />,
  });
  return null;
};
