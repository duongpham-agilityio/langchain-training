import type { ReactNode } from 'react';
import { CopilotKit, type CopilotKitProps } from '@copilotkit/react-core/v2';
import ErrorBoundary, {
  ErrorBoundaryVariant,
} from '@/components/common/ErrorBoundary.tsx';
import { useAuthStore } from '@/store/auth-store';

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
        runtimeUrl={import.meta.env.VITE_COPILOTKIT_RUNTIME_URL}
        headers={headerConfig}
      >
        {children}
      </CopilotKit>
    </ErrorBoundary>
  );
};

export default AppProviders;
