'use client';

import * as React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Miejsce na wszystkie klientowe providery (Auth, Theme itd.)
 * Dzięki temu Header (client) zawsze jest w AuthProvider.
 */
export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}