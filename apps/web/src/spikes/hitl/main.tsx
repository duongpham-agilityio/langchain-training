import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@copilotkit/react-core/v2/styles.css';
import HitlSpikePage from './HitlSpikePage.tsx';

// Spike (M-05): no router, no Supabase auth gate. Throwaway.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HitlSpikePage />
  </StrictMode>,
);
