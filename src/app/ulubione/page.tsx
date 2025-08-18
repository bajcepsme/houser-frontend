// src/app/ulubione/page.tsx
'use client';

import * as React from 'react';
import ListingCard from '@/components/ListingCard';

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

export default function FavoritesPage() {
  const [items, setItems] = React.useState<any[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/favorites`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (res.status === 401) {
          window.location.href = `/login?next=${encodeURIComponent('/ulubione')}`;
          return;
        }
        const data = await res.json();
        const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        if (!cancelled) setItems(list);
      } catch {
        // fallback: z localStorage (gdy brak backendu)
        try {
          const raw = localStorage.getItem('houser:favs');
          const ids = raw ? (JSON.parse(raw) as string[]) : [];
          // minimalny mock – puste kafle z samym ID
          if (!cancelled)
            setItems(
              ids.map((id) => ({
                id,
                title: `Ulubione ogłoszenie #${id}`,
                price: undefined,
                area: undefined,
                address_city: '',
                address_region: '',
                images: [],
                offer_type: 'sprzedaz',
              }))
            );
        } catch {
          if (!cancelled) setItems([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="container-page py-8 space-y-6">
      {/* globalny bg (brand) */}
      <style>{`
        html, body { background: var(--houser-page-bg, var(--page_bg, #f6f8fb)) !important; }
      `}</style>

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Ulubione</h1>
          <p className="text-gray-600">Twoje zapisane ogłoszenia</p>
        </div>
      </div>

      {!items ? (
        <div className="rounded-2xl border bg-white p-8">Ładowanie…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8">Brak zapisanych ogłoszeń.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((l: any) => (
            <ListingCard
              key={l.id}
              id={l.id}
              title={l.title}
              price={l.price}
              area={l.area}
              city={l.address_city}
              region={l.address_region}
              images={l.images}
              offerType={l.offer_type}
              ownerAvatarUrl={
                l.owner_avatar_url ||
                l.owner?.avatar_url ||
                l.user?.avatar_url ||
                l.user_avatar_url ||
                l.author?.avatar_url ||
                undefined
              }
              ownerProfileHref={
                l.owner_profile_url ||
                l.owner?.profile_url ||
                l.user?.profile_url ||
                l.user_profile_url ||
                undefined
              }
              ownerSlug={l.owner?.slug || l.user?.slug || undefined}
              ownerId={l.owner?.id || l.user?.id || l.user_id || undefined}
              view="grid"
            />
          ))}
        </div>
      )}
    </main>
  );
}