// Structural subset of an AG-UI message — only assistant messages carry
// `toolCalls`. Typed structurally instead of importing `Message` from
// `@ag-ui/core` so a version skew between our direct dependency and the copy
// CopilotKit bundles can't break assignability of `agent.messages`.
interface MessageWithToolCalls {
  role: string;
  toolCalls?: ReadonlyArray<{ id: string; function: { name: string } }>;
}

// Returns the id of the newest call to `toolName` (or any of several tools) in the thread, or null when
// the tool was never called. Messages are in chronological order, so the last
// match is the latest call.
export const findLatestToolCallId = (
  messages: ReadonlyArray<MessageWithToolCalls>,
  toolName: string | ReadonlyArray<string>,
): string | null => {
  const names = typeof toolName === 'string' ? [toolName] : toolName;
  const calls = messages
    .flatMap((message) => message.toolCalls ?? [])
    .filter((toolCall) => names.includes(toolCall.function.name));

  return calls[calls.length - 1]?.id ?? null;
};
