'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { rememberNext } from '@/utils/nextAfterLogin';

export function useAuthGuard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (isLoading) return;        // czekamy aż AuthContext się załaduje
    if (!user) {
      const full =
        pathname + (search?.toString() ? `?${search.toString()}` : '');
      // zapamiętaj dokąd user chciał wejść
      rememberNext(full);
      // przekieruj na logowanie z ?next=
      router.replace(`/logowanie?next=${encodeURIComponent(full)}`);
    }
  }, [user, isLoading, pathname, search, router]);

  return { user, isLoading };
}