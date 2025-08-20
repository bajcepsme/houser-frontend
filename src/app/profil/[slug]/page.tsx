'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileListings from '@/components/ProfileListings';

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading } = useAuth();

  const slug = decodeURIComponent((params?.slug as string) ?? '');

  const mySlug = useMemo(() => {
    const n = (user as any)?.slug || user?.name;
    return n ? String(n).toLowerCase().trim().replace(/\s+/g, '-') : '';
  }, [user]);

  useEffect(() => {
    if (!isLoading && mySlug && slug.toLowerCase().trim() === mySlug) {
      router.replace('/moje-konto');
    }
  }, [isLoading, mySlug, slug, router]);

  return <ProfileListings mode="public" slug={slug} key={slug} />;
}
