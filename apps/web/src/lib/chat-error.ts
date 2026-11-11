export const enum ChatErrorKind {
  Unauthorized = 'unauthorized',
  Server = 'server',
  Network = 'network',
  Other = 'other',
}

// CopilotKit hands over the response body as the error message (the server
// answers 401 with {"error":"Unauthorized"}), so the kind is read from the text.
const UNAUTHORIZED_PATTERN = /unauthori[sz]ed|\b401\b/i;
const SERVER_PATTERN =
  /\b5\d{2}\b|internal server error|bad gateway|service unavailable|gateway timeout/i;
const NETWORK_PATTERN = /failed to fetch|networkerror|network request failed|load failed/i;

export const classifyChatError = (error: Error): ChatErrorKind => {
  const text = `${error.name} ${error.message}`;
  if (UNAUTHORIZED_PATTERN.test(text)) return ChatErrorKind.Unauthorized;
  if (SERVER_PATTERN.test(text)) return ChatErrorKind.Server;
  if (error instanceof TypeError || NETWORK_PATTERN.test(text)) return ChatErrorKind.Network;
  return ChatErrorKind.Other;
};

export const CHAT_ERROR_TITLES: Record<ChatErrorKind, string> = {
  [ChatErrorKind.Unauthorized]: 'Your session expired. Sign in again to send this message.',
  [ChatErrorKind.Server]: 'Release Builder had a problem on the server.',
  [ChatErrorKind.Network]: 'Could not reach the Release Builder server.',
  [ChatErrorKind.Other]: 'Message failed to send.',
};
