import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../api/endpoints';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: Role) => Promise<void>;
  hasRole: (...allowedRoles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS: Record<Role, { email: string; name: string; title: string }> = {
  ADMIN: { email: 'admin@flowledger.io', name: 'Sourav Singh', title: 'System Administrator' },
  SALES: { email: 'sales@flowledger.io', name: 'Priya Sharma', title: 'Senior Sales Executive' },
  WAREHOUSE: { email: 'warehouse@flowledger.io', name: 'Arun Kumar Patel', title: 'Warehouse Lead' },
  ACCOUNTS: { email: 'accounts@flowledger.io', name: 'Ananya Sen', title: 'Accounts Officer' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('flowledger_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('flowledger_token');
      const storedUser = localStorage.getItem('flowledger_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Refresh user profile in background
          const res = (await api.auth.getMe()) as any;
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('flowledger_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.error('Session validation error:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password = 'password123') => {
    setIsLoading(true);
    try {
      const res = (await api.auth.login({ email, password })) as any;
      const { token: newToken, user: newUser } = res.data;

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('flowledger_token', newToken);
      localStorage.setItem('flowledger_user', JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoRole = async (role: Role) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, 'password123');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('flowledger_token');
    localStorage.removeItem('flowledger_user');
  };

  const hasRole = (...allowedRoles: Role[]) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        switchDemoRole,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
