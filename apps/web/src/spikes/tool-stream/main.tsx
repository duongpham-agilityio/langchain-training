import { createRoot } from 'react-dom/client';
import '@copilotkit/react-core/v2/styles.css';
import { CopilotChat, CopilotKit } from '@copilotkit/react-core/v2';
import { FrontendToolRoute, ForwardingRoute } from './SpikeTools.tsx';

// SPIKE (M-04, throwaway). ?route=frontend (default) | forwarding picks which
// server route + client tool style is mounted. No auth: talks to the spike server.
const route = new URLSearchParams(location.search).get('route') ?? 'frontend';
const AGENT_ID = route === 'forwarding' ? 'spikeForwarding' : 'spikeFrontendTool';

createRoot(document.getElementById('root')!).render(
  <CopilotKit runtimeUrl="http://localhost:4010/api/copilotkit">
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <p style={{ margin: 8, fontFamily: 'monospace' }}>route: {route} · agent: {AGENT_ID}</p>
      {route === 'forwarding' ? <ForwardingRoute /> : <FrontendToolRoute />}
      <CopilotChat agentId={AGENT_ID} className="min-h-0 flex-1" />
    </div>
  </CopilotKit>,
);
