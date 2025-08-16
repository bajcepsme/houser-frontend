'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type Abilities = {
  update: boolean;
  delete: boolean;
};

export function useListingAbilities(listingId: number | string) {
  const { token } = useAuth();
  const [abilities, setAbilities] = useState<Abilities>({ update: false, delete: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listingId || !token) return;

    const fetchAbilities = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/listings/${listingId}/abilities`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAbilities(data);
      } catch (err) {
        console.error('Błąd pobierania abilities:', err);
        setAbilities({ update: false, delete: false });
      } finally {
        setLoading(false);
      }
    };

    fetchAbilities();
  }, [listingId, token]);

  return { abilities, loading };
}
