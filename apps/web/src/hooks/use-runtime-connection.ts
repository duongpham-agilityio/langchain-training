import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  useCopilotKit,
  CopilotKitCoreErrorCode,
  CopilotKitCoreRuntimeConnectionStatus,
} from '@copilotkit/react-core/v2';
import { ChatErrorKind, classifyChatError } from '@/lib/chat-error.ts';

interface UseRuntimeConnectionResult {
  hasConnectionError: boolean;
  errorMessage: string | null;
  // The runtime answered 401: the session is gone, reloading cannot fix it.
  isUnauthorized: boolean;
}

export const useRuntimeConnection = (): UseRuntimeConnectionResult => {
  const { copilotkit } = useCopilotKit();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const subscription = copilotkit.subscribe({
        onRuntimeConnectionStatusChanged: () => onStoreChange(),
      });
      return () => subscription.unsubscribe();
    },
    [copilotkit],
  );

  const status = useSyncExternalStore(
    subscribe,
    () => copilotkit.runtimeConnectionStatus,
  );

  useEffect(() => {
    const subscription = copilotkit.subscribe({
      onError: ({ error, code }) => {
        if (code !== CopilotKitCoreErrorCode.RUNTIME_INFO_FETCH_FAILED) return;

        setErrorMessage(error.message);
        setIsUnauthorized(
          (error as { runtimeInfoStatus?: number }).runtimeInfoStatus === 401 ||
            classifyChatError(error) === ChatErrorKind.Unauthorized,
        );
      },
    });
    return () => subscription.unsubscribe();
  }, [copilotkit]);

  // Only `Error` means the runtime is unreachable. `Disconnected` is also the
  // state before CopilotKit's mount effect starts the first /info request, so
  // treating it as offline flashed the error on every mount.
  const hasConnectionError =
    status === CopilotKitCoreRuntimeConnectionStatus.Error;

  return {
    hasConnectionError,
    errorMessage: hasConnectionError ? errorMessage : null,
    isUnauthorized: hasConnectionError && isUnauthorized,
  };
};
