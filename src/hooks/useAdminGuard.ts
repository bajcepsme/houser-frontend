'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function useAdminGuard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user || !(user as any).is_superadmin) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  return { user, isLoading };
}
