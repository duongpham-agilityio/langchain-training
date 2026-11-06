import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import './index.css';
import '@copilotkit/react-core/v2/styles.css';
import '@/styles/copilotkit-theme.css';
import { router } from './routes/router.ts';
import QueryProvider from './providers/QueryProvider.tsx';

createRoot(document.getElementById('root')!, {
  onUncaughtError: (error, info) =>
    console.error('[uncaught]', error, info.componentStack),
  onCaughtError: (error, info) =>
    console.error('[caught by boundary]', error, info.componentStack),
}).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </StrictMode>,
);
