import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { login as apiLogin, logout as apiLogout } from '@/lib/api/authApi';
import { getAccessToken } from '@/lib/api/tokenStorage';
import { decodeJwtPayload } from '@/lib/api/jwt';

// Shaped to match what RbacContext's deriveUser() expects, so nothing
// downstream (RbacContext, etc.) needs to change.
export interface AppUser {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromToken(token: string, fallbackEmail?: string): AppUser {
  const claims = decodeJwtPayload(token) ?? {};
  const email = String(claims.email ?? fallbackEmail ?? 'unknown@icaroprojects.com');
  return {
    id: String(claims.sub ?? claims.id ?? email),
    email,
    user_metadata: {
      full_name: claims.name ?? claims.full_name,
      // TODO: backend doesn't return a role yet — hardcoded to 'admin'
      // (full access) for testing. Swap this to `claims.role` once the
      // API sends it, and remove the fallback.
      role: claims.role ?? 'admin',
      permissions: claims.permissions,
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setUser(userFromToken(token));
    }
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signIn(email: string, password: string) {
        try {
          const res = await apiLogin({ email, password });
          setUser(userFromToken(res.access_token, email));
          return { error: null };
        } catch (err) {
          return { error: err instanceof Error ? err.message : 'Login failed' };
        }
      },
      signOut() {
        apiLogout();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
