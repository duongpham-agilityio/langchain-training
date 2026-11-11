import { create } from 'zustand';

import type { ChatErrorKind } from '@/lib/chat-error.ts';

export interface ChatSendFailure {
  // The user message whose run failed; FailedMessageNotice renders under it.
  messageId: string;
  kind: ChatErrorKind;
  title: string;
  detail: string;
}

interface ChatSendFailureStoreState {
  failure: ChatSendFailure | null;
  setFailure: (failure: ChatSendFailure) => void;
  clearFailure: () => void;
}

export const useChatSendFailureStore = create<ChatSendFailureStoreState>()((set) => ({
  failure: null,
  setFailure: (failure) => set({ failure }),
  clearFailure: () => set({ failure: null }),
}));
