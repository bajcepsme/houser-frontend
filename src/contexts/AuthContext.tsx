'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type User = {
  id: number;
  name?: string;
  email?: string;
  avatar?: string | null;
  updated_at?: string;
  is_superadmin?: boolean; // <--- DODANE
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => false,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchUser = async (tkn: string) => {
    try {
      const res = await fetch(`${API}/api/v1/user`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${tkn}`,
        },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('401');
      const data = await res.json();
      setUser(data);
      return true;
    } catch {
      setUser(null);
      return false;
    }
  };

  // 1) Start aplikacji: wczytaj token z localStorage i spróbuj pobrać /user
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('houser_token') : null;
    if (saved) {
      setToken(saved);
      fetchUser(saved).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Logowanie: zapisz token → pobierz usera
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API}/api/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;

      const data = await res.json();
      const tkn: string =
        data.token || data.access_token || data.data?.token || data?.data?.access_token;

      if (!tkn) return false;

      localStorage.setItem('houser_token', tkn);
      setToken(tkn);

      const ok = await fetchUser(tkn);
      return ok;
    } catch {
      return false;
    }
  };

  // 3) Wylogowanie
  const logout = () => {
    localStorage.removeItem('houser_token');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
