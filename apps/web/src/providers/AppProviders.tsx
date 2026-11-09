import type { ReactNode } from 'react';
import { CopilotKit, type CopilotKitProps } from '@copilotkit/react-core/v2';
import ErrorBoundary, {
  ErrorBoundaryVariant,
} from '@/components/common/ErrorBoundary.tsx';
import { COPILOTKIT_ROUTE_PATH } from '@/constants/endpoints.ts';
import { getRequiredEnv, joinUrl } from '@/lib/env.ts';
import { useAuthStore } from '@/store/auth-store';

// Must equal the server's CopilotKit basePath exactly; the client appends its own sub-paths.
const COPILOTKIT_RUNTIME_URL = joinUrl(
  getRequiredEnv(import.meta.env.VITE_API_SERVER_URL, 'VITE_API_SERVER_URL'),
  COPILOTKIT_ROUTE_PATH,
);

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders = ({ children }: AppProvidersProps) => {
  const accessToken = useAuthStore((state) => state.session!.accessToken);

  const headerConfig: CopilotKitProps['headers'] = {
    Authorization: `Bearer ${accessToken}`,
  };

  return (
    <ErrorBoundary title="The app crashed" variant={ErrorBoundaryVariant.Page}>
      <CopilotKit
        runtimeUrl={COPILOTKIT_RUNTIME_URL}
        headers={headerConfig}
      >
        {children}
      </CopilotKit>
    </ErrorBoundary>
  );
};

export default AppProviders;
