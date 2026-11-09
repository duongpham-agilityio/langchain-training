import {
  CopilotChat,
  CopilotKit,
  ToolCallStatus,
  useHumanInTheLoop,
} from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Must match the spike server (apps/ai/src/spikes/hitl).
const SPIKE_RUNTIME_URL = 'http://localhost:4100/api/copilotkit';
const SPIKE_AGENT_ID = 'hitlSpikeAgent';
const CONFIRM_TOOL_NAME = 'confirmAction';

const ConfirmPrompt = () => {
  useHumanInTheLoop({
    name: CONFIRM_TOOL_NAME,
    description: 'Ask the user to approve or reject an action before it runs.',
    parameters: z.object({ action: z.string() }),
    render: (props) => (
      <div data-testid="confirm-card" className="my-2 rounded border p-3">
        <p>
          Confirm: <strong>{props.args.action}</strong>
        </p>
        {props.status === ToolCallStatus.Executing && (
          <div className="mt-2 flex gap-2">
            <button onClick={() => void props.respond('approved')}>
              Approve
            </button>
            <button onClick={() => void props.respond('rejected')}>
              Reject
            </button>
          </div>
        )}
        {props.status === ToolCallStatus.Complete && (
          <p data-testid="confirm-result">Answered: {props.result}</p>
        )}
      </div>
    ),
  });
  return null;
};

const HitlSpikePage = () => (
  <CopilotKit runtimeUrl={SPIKE_RUNTIME_URL}>
    <ConfirmPrompt />
    <div style={{ height: '100vh' }}>
      <CopilotChat agentId={SPIKE_AGENT_ID} />
    </div>
  </CopilotKit>
);

export default HitlSpikePage;
