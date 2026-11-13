import type { ReactNode } from 'react';
import { CopilotKit, type CopilotKitProps } from '@copilotkit/react-core/v2';
import ErrorBoundary, {
  ErrorBoundaryVariant,
} from '@/components/common/ErrorBoundary.tsx';
import { RUNTIME_BASE_PATH, TIME_ZONE_HEADER } from '@training/contracts';
import { getRequiredEnv, joinUrl } from '@/lib/env.ts';
import { getBrowserTimeZone } from '@/lib/time-zone.ts';
import { useAuthStore } from '@/store/auth-store';

// Must equal the server's CopilotKit basePath exactly; the client appends its own sub-paths.
const COPILOTKIT_RUNTIME_URL = joinUrl(
  getRequiredEnv(import.meta.env.VITE_API_SERVER_URL, 'VITE_API_SERVER_URL'),
  RUNTIME_BASE_PATH,
);

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders = ({ children }: AppProvidersProps) => {
  const accessToken = useAuthStore((state) => state.session!.accessToken);

  const headerConfig: CopilotKitProps['headers'] = {
    Authorization: `Bearer ${accessToken}`,
    [TIME_ZONE_HEADER]: getBrowserTimeZone(),
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
