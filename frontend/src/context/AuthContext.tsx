import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authAPI, type User } from '../services/api';

const USER_STORAGE_KEY = 'simpleforum_user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

  const login = useCallback(async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.data.user));
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore server errors
    }
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
