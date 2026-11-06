import type { Session } from '@supabase/supabase-js';
import { supabaseBrowserClient } from '@/lib/supabase/browser-client.ts';
import type { AuthService, AuthServiceSession } from '@/lib/auth/auth-service.ts';

const toAuthServiceSession = (session: Session | null): AuthServiceSession | null =>
  session
    ? {
        accessToken: session.access_token,
        user: { id: session.user.id, email: session.user.email ?? null },
      }
    : null;

export const supabaseAuthService: AuthService = {
  signInWithOAuth: async (provider, redirectTo) => {
    await supabaseBrowserClient.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
  },
  signInWithPassword: async (email, password) => {
    const { error } = await supabaseBrowserClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  },
  signOut: async () => {
    await supabaseBrowserClient.auth.signOut();
  },
  onAuthStateChange: (listener) => {
    const {
      data: { subscription },
    } = supabaseBrowserClient.auth.onAuthStateChange((_event, session) => {
      listener(toAuthServiceSession(session));
    });
    return () => subscription.unsubscribe();
  },
};
