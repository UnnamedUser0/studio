'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  name: string;
  email: string;
  avatar: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['admin@pizzapp.com', 'test@example.com'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const login = useCallback((email: string) => {
    // In a real app, this would involve a server call and password verification
    const name = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    setUser({ name, email, avatar: `https://api.dicebear.com/8.x/micah/svg?seed=${email}` });
    router.push('/');
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    router.push('/');
  }, [router]);
  
  const isAdmin = useMemo(() => (user ? ADMIN_EMAILS.includes(user.email) : false), [user]);

  const value = useMemo(() => ({ user, login, logout, isAdmin }), [user, login, logout, isAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
