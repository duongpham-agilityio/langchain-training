import { NEW_CHAT_TITLE } from '@/constants/threads.ts';
import type { ThreadSummary } from '@training/contracts';

// A title is a placeholder while the server has not generated one yet: either
// empty (the thread gate creates the row before the title exists) or the
// thread id itself (what older client drafts wrote). Both must never reach the
// sidebar as text.
export const isPlaceholderTitle = (title: string, id: string): boolean =>
  title === '' || title === id;

export const getThreadDisplayTitle = (thread: ThreadSummary): string =>
  isPlaceholderTitle(thread.title, thread.id) ? NEW_CHAT_TITLE : thread.title;
