// src/components/admin/AdminGuard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user || !user.is_superadmin) {
        router.replace('/'); // brak uprawnień → do strony głównej
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Ładowanie…
      </div>
    );
  }
  if (!user || !user.is_superadmin) {
    return null; // na moment do czasu przekierowania
  }
  return <>{children}</>;
}
