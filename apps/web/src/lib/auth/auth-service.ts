export type OAuthProvider = 'google' | 'github';

export interface AuthServiceUser {
  id: string;
  email: string | null;
}

export interface AuthServiceSession {
  accessToken: string;
  user: AuthServiceUser;
}

export type AuthStateListener = (session: AuthServiceSession | null) => void;

export interface AuthService {
  signInWithOAuth: (provider: OAuthProvider, redirectTo: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  onAuthStateChange: (listener: AuthStateListener) => () => void;
}
