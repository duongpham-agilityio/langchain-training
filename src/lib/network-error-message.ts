export const toNetworkErrorMessage = (error: unknown, target: string): string => {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return `${target} timed out. The server accepted the connection but never answered.`;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return `${target} was cancelled.`;
  }

  if (error instanceof TypeError) {
    return `Could not connect to ${target}. Check that the Mastra server is running and VITE_MASTRA_SERVER_URL points at it.`;
  }

  return error instanceof Error ? error.message : String(error);
};
