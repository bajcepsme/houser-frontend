'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Jeśli używasz dodatkowych providerów (np. react-query, theme itp.),
 * owiń nimi dzieci **wewnątrz** AuthProvider albo obok — ważne tylko,
 * żeby AppProviders był komponentem klienckim.
 */
export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
