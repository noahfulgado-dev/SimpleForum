import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authAPI, type User } from '../services/api';
import { ACCESS_KEY, REFRESH_KEY } from '../services/axios';

const USER_STORAGE_KEY = 'simpleforum_user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const access = localStorage.getItem(ACCESS_KEY);
    if (!access) {
      setLoading(false);
      return;
    }
    authAPI.getCurrentUser()
      .then((res) => {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.data));
        setUser(res.data);
      })
      .catch(() => {
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem(ACCESS_KEY, res.data.access);
    localStorage.setItem(REFRESH_KEY, res.data.refresh);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.data.user));
    setUser(res.data.user);
  }, []);

  const googleLogin = useCallback(async (accessToken: string) => {
    const res = await authAPI.googleLogin(accessToken);
    localStorage.setItem(ACCESS_KEY, res.data.access);
    localStorage.setItem(REFRESH_KEY, res.data.refresh);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.data.user));
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore server errors
    }
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.getCurrentUser();
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.data));
      setUser(res.data);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
