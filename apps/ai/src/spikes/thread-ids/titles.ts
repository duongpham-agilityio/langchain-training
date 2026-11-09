import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export const TITLE_PROMPT = "Write a title of at most six words for this chat:";

export type ThreadRow = {
  id: string;
  title: string;
  resourceId: string;
  createdAt: string;
  updatedAt: string;
};

/** In-memory stand-in for the table behind `GET /api/memory/threads`. */
export const createTitleStore = () => {
  const rows = new Map<string, ThreadRow>();

  return {
    has: (threadId: string) => rows.has(threadId),
    set: (row: ThreadRow) => rows.set(row.id, row),
    /** Same response shape as the route the web client polls (M-24). */
    listThreads: (resourceId: string) => ({
      threads: [...rows.values()].filter((r) => r.resourceId === resourceId),
    }),
  };
};

export type TitleStore = ReturnType<typeof createTitleStore>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fire-and-forget title generation. The caller must NOT await the returned
 * promise: the run finishes first and the title lands later. It never rejects,
 * so a failing title model cannot fail (or crash) the run.
 * `delayMs` simulates a slow model so the spike can prove the ordering.
 */
export const generateTitleInBackground = (params: {
  model: BaseChatModel;
  store: TitleStore;
  threadId: string;
  resourceId: string;
  firstUserText: string;
  delayMs: number;
  onError?: (error: unknown) => void;
}): Promise<void> => {
  const { model, store, threadId, resourceId, firstUserText, delayMs } = params;
  return (async () => {
    try {
      await sleep(delayMs);
      const result = await model.invoke(`${TITLE_PROMPT}\n${firstUserText}`);
      const now = new Date().toISOString();
      store.set({
        id: threadId,
        title: result.text.trim(),
        resourceId,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      params.onError?.(error);
    }
  })();
};
