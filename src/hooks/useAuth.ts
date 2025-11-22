import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, role: 'owner' | 'foreman') => Promise<void>;
  signup: (email: string, role: 'owner' | 'foreman') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('siteSafeUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, role: 'owner' | 'foreman') => {
    // Simulate API call
    await new Promise(res => setTimeout(res, 500));
    const newUser: User = { email, role };
    localStorage.setItem('siteSafeUser', JSON.stringify(newUser));
    setUser(newUser);
  }, []);
  
  const signup = useCallback(async (email: string, role: 'owner' | 'foreman') => {
    // In a real app, this would be different from login
    await new Promise(res => setTimeout(res, 500));
    const newUser: User = { email, role };
    localStorage.setItem('siteSafeUser', JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('siteSafeUser');
    setUser(null);
  }, []);

  const value = { user, loading, login, signup, logout };

  // FIX: The original code used JSX in a .ts file, which is not allowed and caused parsing errors.
  // Replaced with React.createElement to resolve the issue.
  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
