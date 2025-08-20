// src/app/ulubione/page.tsx
'use client';

import * as React from 'react';
import ListingCard from '@/components/ListingCard';
import { FAVS_EVENT } from '@/lib/favorites';

/* ================== KONFIG / BAZA API ================== */

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

/* =============== helpers: auth / URL / obrazy / avatar =============== */

function getToken(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  } catch {
    return null;
  }
}
function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function toAbsoluteApiUrl(path?: string | null): string {
  if (!path) return '';
  const p = String(path).trim();
  if (!p) return '';
  if (/^(data:|blob:|https?:\/\/)/i.test(p)) return p;
  return `${API_BASE}${p.startsWith('/') ? '' : '/'}${p}`;
}

function resolveApiAvatarUrl(raw?: string | null): string {
  if (!raw) return '';
  let s = String(raw).trim().replace(/^\/+/, '');
  if (/^(data:|blob:|https?:\/\/)/i.test(s)) return s;
  if (s.startsWith('avatars/')) s = `storage/${s}`;
  return toAbsoluteApiUrl(`/${s}`);
}

function pickOwnerAvatar(l: any): string {
  const c = [
    l.owner_avatar_url, l.owner_avatar,
    l.owner?.avatar_url, l.owner?.avatar, l.owner?.photo_url,
    l.user?.avatar_url,  l.user?.avatar,  l.user?.photo_url,
    l.created_by?.avatar_url, l.created_by?.avatar,
  ];
  const first = c.find((v) => typeof v === 'string' && !!v.trim());
  return resolveApiAvatarUrl(first);
}

/* ================= normalizacja jednego ogłoszenia ================= */

function normalizeListing(input: any) {
  const l = input?.data ?? input ?? {};

  const id = l.id ?? l.listing_id ?? l.uuid ?? l.slug ?? '';
  const title =
    l.title ||
    l.name ||
    (typeof l.address_street === 'string' && l.address_street) ||
    (id ? `Ogłoszenie #${id}` : 'Ogłoszenie');

  const imgsRaw: any[] = Array.isArray(l.images) ? l.images : Array.isArray(l.photos) ? l.photos : [];
  const images = imgsRaw
    .slice()
    .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0))
    .map((img: any) => {
      const url = toAbsoluteApiUrl(img?.url ?? img?.src ?? img);
      return { ...img, url };
    });

  const city = l.address_city ?? l.city ?? '';
  const region = l.address_region ?? l.region ?? l.voivodeship ?? '';

  const offer_type = l.offer_type ?? l.type ?? l.category ?? 'sprzedaz';

  const ownerId =
    l.owner_id ?? l.user_id ?? l.created_by_id ??
    l.owner?.id ?? l.user?.id ?? l.created_by?.id ?? null;

  const ownerSlug = l.owner?.slug ?? l.user?.slug ?? null;

  const owner_profile_href = ownerSlug
    ? `/profil/${ownerSlug}/`
    : ownerId
    ? `/profil/${ownerId}/`
    : '';

  return {
    id,
    title,
    price: l.price,
    area: l.area ?? l.square_meters ?? l.lot_area,
    address_city: city,
    address_region: region,
    images,
    offer_type,
    owner_avatar_url: pickOwnerAvatar(l),
    owner_profile_href,
    ownerId,
  };
}

/* ======= pobranie pełnego ogłoszenia po ID (PUBLICZNE, bez cookies) ======= */

async function fetchListingById(id: string | number) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/listings/${id}`, {
      // celowo BEZ credentials — żeby nie wchodzić w CORS z cookies
      headers: { Accept: 'application/json', ...authHeaders() },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return normalizeListing(json);
  } catch {
    return null;
  }
}

/* ===================== główne pobieranie ulubionych ===================== */

async function loadFavorites(): Promise<any[]> {
  const token = getToken();

  // 1) Jeśli MAMY token → spróbuj backend. Jeśli brak tokenu → pomiń backend i od razu LS.
  if (token) {
    const candidates = ['/api/v1/favorites', '/api/v1/user/favorites', '/api/v1/favourites', '/api/v1/favorites/list'];
    for (const path of candidates) {
      try {
        const res = await fetch(`${API_BASE}${path}`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (res.status === 401) {
          // wylogowany → na stronę logowania
          window.location.href = `/logowanie?next=${encodeURIComponent('/ulubione')}`;
          return [];
        }
        if (!res.ok) continue;

        const json = await res.json();
        const payload =
          (Array.isArray(json?.items) && json.items) ||
          (Array.isArray(json?.data) && json.data) ||
          (Array.isArray(json) && json) ||
          null;

        if (Array.isArray(payload) && (typeof payload[0] === 'string' || typeof payload[0] === 'number')) {
          const detailed = (await Promise.all(payload.map((id: any) => fetchListingById(id)))).filter(Boolean) as any[];
          return detailed;
        }
        if (!payload) {
          const ids = json?.ids || json?.favorites || json?.favourites || json?.data?.ids;
          if (Array.isArray(ids)) {
            const detailed = (await Promise.all(ids.map((id: any) => fetchListingById(id)))).filter(Boolean) as any[];
            return detailed;
          }
          continue;
        }
        return payload.map(normalizeListing);
      } catch {
        // spróbujemy kolejnego kandydata
      }
    }
  }

  // 2) Fallback: localStorage — mamy tam ID-ki zapisane przez toggle
  try {
    const raw = localStorage.getItem('houser:favs');
    const ids: (string | number)[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const detailed = (await Promise.all(ids.map((id) => fetchListingById(id)))).filter(Boolean) as any[];
    return detailed;
  } catch {
    return [];
  }
}

/* =============================== PAGE =============================== */

export default function FavoritesPage() {
  const [items, setItems] = React.useState<any[] | null>(null);

  // initial load
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const list = await loadFavorites();
      if (alive) setItems(list);
    })();
    return () => { alive = false; };
  }, []);

  // live reload on favs change (inne karty/strony)
  React.useEffect(() => {
    const reload = async () => setItems(await loadFavorites());
    const on = () => { reload(); };
    window.addEventListener(FAVS_EVENT, on as EventListener);
    window.addEventListener('storage', on as EventListener);
    return () => {
      window.removeEventListener(FAVS_EVENT, on as EventListener);
      window.removeEventListener('storage', on as EventListener);
    };
  }, []);

  return (
    <main className="container-page py-8 space-y-6">
      {/* tło brandowe bez migania */}
      <style>{`html,body{background:var(--houser-page-bg, var(--page_bg, #f6f8fb)) !important;}`}</style>

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
              ownerAvatarUrl={l.owner_avatar_url}
              ownerProfileHref={l.owner_profile_href}
              ownerId={l.ownerId}
              view="grid"
            />
          ))}
        </div>
      )}
    </main>
  );
}
