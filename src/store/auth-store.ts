import { create } from 'zustand';
import type { AuthServiceSession } from '@/lib/auth/auth-service.ts';

export const enum AuthStatus {
  Loading = 'loading',
  SignedIn = 'signed-in',
  SignedOut = 'signed-out',
}

interface AuthStoreState {
  session: AuthServiceSession | null;
  status: AuthStatus;
  setSession: (session: AuthServiceSession | null) => void;
}

export const useAuthStore = create<AuthStoreState>()((set) => ({
  session: null,
  status: AuthStatus.Loading,
  setSession: (session) =>
    set({
      session,
      status: session ? AuthStatus.SignedIn : AuthStatus.SignedOut,
    }),
}));
