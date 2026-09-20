import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { guestLogin, login, register, updateUserProfileApi } from '../services/auth.service';
import { getSocket } from '../socket/socket.client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  loginAsGuest: (username: string, avatarId: string) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  registerAccount: (username: string, email: string, password: string, avatarId: string) => Promise<void>;
  updateProfile: (username: string, avatarId: string, gameId?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'heggy_token';
const USER_KEY  = 'heggy_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(false);

  const persist = useCallback((u: User, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  // Listen for unauthorized 401 events to auto-reset stale auth
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('heggy:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('heggy:unauthorized', handleUnauthorized);
  }, []);

  const updateProfile = useCallback(async (newUsername: string, newAvatarId: string, gameId?: string) => {
    try {
      const authData = await updateUserProfileApi(newUsername, newAvatarId);
      persist(authData.user, authData.token);

      // Emit socket event to notify room of avatar/nickname change
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('LOBBY:UPDATE_PROFILE', {
          gameId,
          nickname: newUsername,
          avatarId: newAvatarId,
        });
      }
    } catch {
      // Fallback local update if offline
      if (user) {
        const updated: User = {
          ...user,
          username: newUsername,
          avatar_id: newAvatarId,
        };
        setUser(updated);
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
      }
    }
  }, [user, persist]);

  const loginAsGuest = useCallback(async (username: string, avatarId: string) => {
    setIsLoading(true);
    try {
      const { user: u, token: t } = await guestLogin(username, avatarId);
      persist(u, t);
    } finally {
      setIsLoading(false);
    }
  }, [persist]);

  const loginWithCredentials = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: u, token: t } = await login(email, password);
      persist(u, t);
    } finally {
      setIsLoading(false);
    }
  }, [persist]);

  const registerAccount = useCallback(async (
    username: string, email: string, password: string, avatarId: string
  ) => {
    setIsLoading(true);
    try {
      const { user: u, token: t } = await register(username, email, password, avatarId);
      persist(u, t);
    } finally {
      setIsLoading(false);
    }
  }, [persist]);

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!token && !!user,
      isLoading,
      loginAsGuest,
      loginWithCredentials,
      registerAccount,
      updateProfile,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
