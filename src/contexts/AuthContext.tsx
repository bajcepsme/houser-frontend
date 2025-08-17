// src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type User = {
  id: number;
  name: string;
  email: string;
  is_superadmin?: boolean;
  [k: string]: any;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // przy starcie: wczytaj token z localStorage i spróbuj pobrać /api/v1/user
  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!t) {
      setIsLoading(false);
      return;
    }
    setToken(t);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/user`, {
          headers: { Authorization: `Bearer ${t}`, Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('unauth');
        const u = await res.json();
        setUser(u);
      } catch {
        // token nieaktualny
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          if (j?.message) msg += `: ${j.message}`;
        } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      // BACKEND zwraca { user: {...}, token: "..." }
      const t = data?.token as string | undefined;
      const u = data?.user as User | undefined;
      if (!t || !u) throw new Error('Brak tokena lub użytkownika w odpowiedzi API.');

      localStorage.setItem('token', t);
      setToken(t);
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/user`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        setUser(await res.json());
      } else if (res.status === 401) {
        logout();
      }
    } catch {
      // ignorujemy — pozostawiamy stan jak jest
    }
  }

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout, refreshUser }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
