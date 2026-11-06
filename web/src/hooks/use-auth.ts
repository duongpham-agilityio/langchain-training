import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { supabaseAuthService } from '@/lib/auth/supabase-auth-service.ts';
import type { OAuthProvider } from '@/lib/auth/auth-service.ts';
import { useAuthStore } from '@/store/auth-store.ts';
import { ROUTE_DASHBOARD } from '@/constants/routings.ts';

export const useAuth = () => {
  const { session, status, setSession } = useAuthStore(
    useShallow((state) => ({
      session: state.session,
      status: state.status,
      setSession: state.setSession,
    })),
  );

  useEffect(() => {
    const unsubscribe = supabaseAuthService.onAuthStateChange(
      async (session) => {
        const randomNumber = Math.floor(Math.random() * 4) + 1;

        setTimeout(() => {
          setSession(session);
        }, 1000 * randomNumber);
      },
    );
    return unsubscribe;
  }, [setSession]);

  const signInWithOAuth = (provider: OAuthProvider) =>
    supabaseAuthService.signInWithOAuth(
      provider,
      `${window.location.origin}${ROUTE_DASHBOARD}`,
    );

  const signInWithPassword = (email: string, password: string) =>
    supabaseAuthService.signInWithPassword(email, password);

  const signOut = () => supabaseAuthService.signOut();

  return { session, status, signInWithOAuth, signInWithPassword, signOut };
};
