'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Grid, List as ListIcon, Pencil, Star, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

/* ================= CSS ================= */
function ensurePageCss() {
  if (typeof document === 'undefined' || document.getElementById('profilelistings-css')) return;
  const s = document.createElement('style'); s.id = 'profilelistings-css';
  s.textContent = `
  .faded-bg { background: radial-gradient(120% 140% at 0% 0%, rgba(59,130,246,.08) 0%, rgba(59,130,246,0) 55%), radial-gradient(140% 120% at 100% 0%, rgba(234,179,8,.07) 0%, rgba(234,179,8,0) 55%), radial-gradient(130% 130% at 80% 100%, rgba(14,165,233,.10) 0%, rgba(14,165,233,0) 60%); }
  .hero-gradient { background: linear-gradient(180deg, rgba(241,245,249,0.65) 0%, rgba(255,255,255,0.6) 100%), radial-gradient(80% 120% at 0% 0%, rgba(59,130,246,.12) 0%, rgba(59,130,246,0) 55%), radial-gradient(100% 140% at 100% 0%, rgba(234,179,8,.10) 0%, rgba(234,179,8,0) 55%), radial-gradient(120% 120% at 100% 100%, rgba(14,165,233,.12) 0%, rgba(14,165,233,0) 60%); backdrop-filter: blur(4px); }
  .card-modern{border-radius:16px;background:#fff;border:1px solid rgba(148,163,184,.35);box-shadow:0 2px 6px rgba(15,23,42,.06)}
  .lift{transition:transform .15s ease,box-shadow .2s ease}.lift:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(15,23,42,.12)}
  .icon-toggle{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(148,163,184,.35);background:#fff;box-shadow:0 2px 6px rgba(15,23,42,.06);color:#334155}
  .icon-toggle:hover{background:#f8fafc;transform:translateY(-1px)}
  .icon-toggle.is-active{background:#1d4ed8;color:#fff;border-color:transparent}
  .act-btn{width:38px;height:38px;border-radius:9999px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(148,163,184,.35);background:#fff;color:#64748b;transition:transform .15s ease,box-shadow .2s ease,color .2s ease,border-color .2s ease,background .2s ease;box-shadow:0 2px 6px rgba(15,23,42,.06)}
  .act-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(15,23,42,.12)}
  .act-btn.edit:hover{color:#1d4ed8;border-color:#1d4ed8;background:#eef2ff}
  .act-btn.promote:hover{color:#b45309;border-color:#f59e0b;background:#fff7ed}
  .act-btn.delete:hover{color:#b91c1c;border-color:#f43f5e;background:#fff1f2}
  .leaflet-popup-content-wrapper,.leaflet-popup-tip{background:transparent!important;box-shadow:none!important;border:none!important}
  .leaflet-popup-content{margin:0!important}.leaflet-popup-close-button{display:none!important}

  /* status badges */
  .status-badge{position:absolute;top:10px;left:10px;font-size:11px;line-height:1;padding:6px 8px;border-radius:10px;font-weight:700;color:#fff}
  .status-published{background:#16a34a}
  .status-draft{background:#9ca3af}
  .status-archived{background:#ef4444}
  `;
  document.head.appendChild(s);
}

/* ================= helpers ================= */
type OwnerT = { id?: number; slug?: string | null; name?: string | null; avatar?: string | null; role?: string; bio?: string };
type ImageT = { id: number; url: string | null; order: number };
export type ListingT = {
  id: number; title: string; price: number | null; address_city: string | null; address_region: string | null;
  lat: number | null; lng: number | null; images: ImageT[]; created_at: string | null; area: number | null;
  status?: string | null; deleted_at?: string | null;
  owner?: OwnerT; user?: OwnerT; owner_id?: number | null;
};
const PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%' height='100%' fill='#f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='18' fill='#94a3b8'>Brak zdjęcia</text></svg>`)}`;
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');

function avatarPathToUrl(val?: string | null) {
  if (!val) return null; const s = String(val).trim(); if (!s) return null;
  if (/^(https?:|data:|blob:)/i.test(s)) return s;
  if (/^avatars\//i.test(s)) return `${API_BASE}/storage/${s.replace(/^\/+/, '')}`;
  if (/^storage\//i.test(s)) return `${API_BASE}/${s.replace(/^\/+/, '')}`;
  const path = s.replace(/^\/+/, '');
  return API_BASE ? `${API_BASE}/${path}` : `/${path}`;
}

function toSlug(s?: string | null) {
  if (!s) return '';
  return s.normalize?.('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-');
}

function imgSrc(u?: string | null) {
  if (!u || typeof u !== 'string' || !u.trim()) return PLACEHOLDER;
  const raw = u.trim();
  if (/^(data:|blob:|https?:\/\/)/i.test(raw)) return raw;
  return API_BASE ? `${API_BASE}/${raw.replace(/^\//, '')}` : `/${raw.replace(/^\//, '')}`;
}
const fmtDots = (n: string) => n.replace(/\D/g, '').replace(/^0+/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const parseDots = (s: string) => Number((s || '').replace(/\D+/g, '')) || 0;
const fmtPrice = (g?: number | null) => (g == null ? '—' : `${(g / 100).toLocaleString('pl-PL')} PLN`);

const isDraft = (s?: string | null) => (s ?? '').toLowerCase() === 'draft';
const isArchived = (s?: string | null, deleted_at?: string | null) =>
  ((s ?? '').toLowerCase() === 'archived') || !!deleted_at;
const isPublished = (s?: string | null) => (s ?? 'published').toLowerCase() === 'published';

/* ============== MAPA ============== */
function MapBoard({ items, focusCoords }: { items: ListingT[]; focusCoords: [number, number] | null }) {
  const mapRef = useRef<any>(null);
  const clusterRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const pinIconRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => { ensurePageCss(); }, []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!mapDivRef.current) return;
      const { default: Leaflet } = await import('leaflet');
      await import('leaflet.markercluster');
      if (cancelled) return;

      LRef.current = Leaflet;
      pinIconRef.current = Leaflet.divIcon({
        className: 'soft-pin',
        html: `<span class="ring"></span><svg viewBox="0 0 48 64" class="pin-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M24 2C13.4 2 4.8 10.6 4.8 21.2C4.8 34.9 24 62 24 62C24 62 43.2 34.9 43.2 21.2C43.2 10.6 34.6 2 24 2Z" fill="#FF8A00"/><circle cx="24" cy="22" r="8.5" fill="#ffffff"/></svg><span class="shadow"></span>`,
        iconSize: [44, 60], iconAnchor: [22, 58],
      });

      const el = mapDivRef.current as any;
      if (el && el._leaflet_id) { el.innerHTML = ''; delete el._leaflet_id; }

      const map = Leaflet.map(mapDivRef.current!, {
        center: [52.237049, 21.017532], zoom: 6, zoomControl: false, scrollWheelZoom: false,
      });
      mapRef.current = map;

      const MT = (process.env.NEXT_PUBLIC_MAPTILER_KEY || '').trim();
      if (MT) {
        Leaflet.tileLayer(
          `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MT}&lang=pl`,
          { attribution: '&copy; MapTiler & OpenStreetMap' }
        ).addTo(map);
      } else {
        Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
      }

      Leaflet.control.zoom({ position: 'bottomright' }).addTo(map);

      const cluster = (Leaflet as any).markerClusterGroup({
        showCoverageOnHover: false, spiderfyOnEveryZoom: true, disableClusteringAtZoom: 16,
        spiderLegPolylineOptions: { weight: 1.2, color: '#64748b', opacity: 0.85 }, maxClusterRadius: 50,
      });
      clusterRef.current = cluster;
      map.addLayer(cluster);

      setMapReady(true);
      setTimeout(() => { if (!cancelled && mapRef.current) { try { mapRef.current.invalidateSize(); } catch {} } }, 120);
    }
    boot();

    return () => {
      cancelled = true; setMapReady(false);
      try { clusterRef.current?.clearLayers(); mapRef.current?.off(); mapRef.current?.remove(); } catch {}
      mapRef.current = null; clusterRef.current = null; LRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const L = LRef.current, map = mapRef.current, cluster = clusterRef.current, pinIcon = pinIconRef.current;
    if (!L || !map || !cluster || !pinIcon) return;
    cluster.clearLayers();
    const bounds: [number, number][] = [];
    items.forEach((l) => {
      const lat = Number(l.lat), lng = Number(l.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const marker = L.marker([lat, lng], { icon: pinIcon });
      marker.bindPopup(
        `<div class="popup-card"><div class="popup-head" style="padding:10px 10px 0 10px"><div class="popup-title" style="font-weight:800;font-size:14px">${(l.title||'').toString().replace(/[<>&"]/g,'')}</div></div><div class="price-badge" style="margin:8px 10px">${fmtPrice(l.price).replace(' PLN',' zł')}</div></div>`,
        { className: 'no-tailwind' }
      );
      cluster.addLayer(marker);
      bounds.push([lat, lng]);
    });
    if (bounds.length) { try { map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] }); } catch {} }
  }, [items, mapReady]);

  useEffect(() => {
    const map = mapRef.current, L = LRef.current;
    if (!map || !L || !focusCoords) return;
    map.flyTo(focusCoords, Math.max(map.getZoom(), 13), { duration: 0.8, easeLinearity: 0.25 });
  }, [focusCoords]);

  return <div ref={mapDivRef} className="rounded-2xl overflow-hidden ring-1 ring-gray-200/70 shadow-sm h-[420px]" />;
}

/* ================= PAGE ================= */
type Props = { mode: 'public' | 'owner'; slug?: string };

function normalizeApiData(data: any[]): ListingT[] {
  return (data || []).map((l: any, i: number) => ({
    id: Number(l.id),
    title: String(l.title ?? ''),
    price: l.price == null ? null : Number(l.price),
    address_city: l.address_city ?? null,
    address_region: l.address_region ?? null,
    lat: l?.lat ?? l?.latitude ?? null,
    lng: l?.lng ?? l?.longitude ?? null,
    images: Array.isArray(l.images)
      ? l.images.map((img: any, j: number) => ({ id: Number(img?.id ?? j), url: img?.url ?? null, order: Number(img?.order ?? j + 1) }))
              .sort((a, b) => a.order - b.order)
      : [],
    created_at: l?.created_at ?? null,
    area: l?.area != null ? Number(l.area) : null,
    status: l?.status ?? null,
    deleted_at: l?.deleted_at ?? null,
    owner: l?.user
      ? { id: l.user.id, slug: l.user.slug, name: l.user.name, avatar: l.user.avatar ?? l.user.avatar_url }
      : l?.owner
      ? { id: l.owner.id, slug: l.owner.slug, name: l.owner.name, avatar: l.owner.avatar_url ?? l.owner.avatar }
      : undefined,
    user: l?.user,
    owner_id: l?.owner_id ?? l?.user_id ?? null,
  }));
}

export default function ProfileListings({ mode, slug }: Props) {
  const { user: authUser, token: authToken, isLoading: authLoading } = useAuth();

  const [items, setItems] = useState<ListingT[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [publicProfileUser, setPublicProfileUser] = useState<OwnerT | null>(null);

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date_desc'|'date_asc'|'price_asc'|'price_desc'|'area_asc'|'area_desc'>('date_desc');
  const [priceMinStr, setPriceMin] = useState(''); const [priceMaxStr, setPriceMax] = useState('');
  const [areaMinStr, setAreaMin] = useState('');   const [areaMaxStr, setAreaMax] = useState('');
  const [hoverCoords, setHoverCoords] = useState<[number, number] | null>(null);

  useEffect(() => { ensurePageCss(); }, []);

  const instanceKey = `${mode}:${slug ?? '-'}`;
  const inFlightKeyRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    setItems([]); setPublicProfileUser(null); setErr(null); setLoading(true);

    inFlightKeyRef.current = instanceKey;
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        let url = '';
        let init: RequestInit = { signal: controller.signal, cache: 'no-store' };

        if (mode === 'owner') {
          if (authLoading) return;
          if (!authToken) { setErr('Musisz być zalogowany.'); return; }
          url = `${API_BASE}/api/v1/my-listings`;
          init.headers = { Accept: 'application/json', Authorization: `Bearer ${authToken}` };
        } else {
          if (!slug) { setErr('Brak slug profilu.'); return; }
          const qs = new URLSearchParams({ user_slug: slug, include: 'images,user' });
          url = `${API_BASE}/api/v1/listings?${qs.toString()}`;
        }

        const res = await fetch(url, init);
        if (!res.ok) throw new Error('Nie udało się pobrać danych.');
        const payload = await res.json();
        const listings = normalizeApiData(payload?.data || []);

        // Public: twardy filtr pod slug; Owner: nic nie tniemy (chcemy i published, i drafty)
        let safeListings = listings;
        if (mode === 'public') {
          const target = toSlug(slug);
          const currentUserSlug = toSlug((authUser as any)?.slug || (authUser as any)?.name || '');
          safeListings = listings.filter((l) => {
            const ownerRaw = l?.user?.slug ?? l?.owner?.slug ?? (l?.user?.name || l?.owner?.name || '');
            const ownerSlug = toSlug(ownerRaw);
            if (!ownerSlug) return true;
            if (currentUserSlug && ownerSlug === currentUserSlug && currentUserSlug !== target) return false;
            return ownerSlug === target && isPublished(l.status) && !isArchived(l.status, l.deleted_at);
          });
        }

        if (inFlightKeyRef.current === instanceKey && !controller.signal.aborted) {
          const uniq = Array.from(new Map(safeListings.map(x => [x.id, x])).values());
          setItems(uniq);
          if (mode === 'public') {
            const ownerData = uniq[0]?.user ?? uniq[0]?.owner ?? null;
            setPublicProfileUser(ownerData ?? { name: slug, slug, avatar: null });
          }
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') setErr(e?.message ?? 'Wystąpił błąd.');
      } finally {
        if (inFlightKeyRef.current === instanceKey && !controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceKey, authLoading, authToken]);

  /* ===== wspólne filtrowanie/sortowanie jako funkcja ===== */
  const applyFilters = (src: ListingT[]) => {
    let arr = [...src];
    const pMin = parseDots(priceMinStr), pMax = parseDots(priceMaxStr);
    const aMin = parseDots(areaMinStr), aMax = parseDots(areaMaxStr);
    if (pMin) arr = arr.filter((x) => (x.price ?? 0) / 100 >= pMin);
    if (pMax) arr = arr.filter((x) => (x.price ?? 0) / 100 <= pMax);
    if (aMin) arr = arr.filter((x) => (x.area ?? 0) >= aMin);
    if (aMax) arr = arr.filter((x) => (x.area ?? 0) <= aMax);
    return arr.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':  return (b.created_at || '').localeCompare(a.created_at || '');
        case 'date_asc':   return (a.created_at || '').localeCompare(b.created_at || '');
        case 'price_asc':  return (a.price ?? 0) - (b.price ?? 0);
        case 'price_desc': return (b.price ?? 0) - (a.price ?? 0);
        case 'area_asc':   return (a.area ?? 0) - (b.area ?? 0);
        case 'area_desc':  return (b.area ?? 0) - (a.area ?? 0);
        default: return 0;
      }
    });
  };

  /* ===== rozbicie na sekcje (tylko owner) ===== */
  const publishedAll = useMemo(() => items.filter((it) => isPublished(it.status) && !isArchived(it.status, it.deleted_at)), [items]);
  const draftsAll    = useMemo(() => items.filter((it) => isDraft(it.status) && !isArchived(it.status, it.deleted_at)), [items]);
  const archivedAll  = useMemo(() => items.filter((it) => isArchived(it.status, it.deleted_at)), [items]);

  const filteredPublicOnly = useMemo(() => applyFilters(items), [items, priceMinStr, priceMaxStr, areaMinStr, areaMaxStr, sortBy]);
  const filteredPublished  = useMemo(() => applyFilters(publishedAll), [publishedAll, priceMinStr, priceMaxStr, areaMinStr, areaMaxStr, sortBy]);
  const filteredDrafts     = useMemo(() => applyFilters(draftsAll), [draftsAll, priceMinStr, priceMaxStr, areaMinStr, areaMaxStr, sortBy]);
  const filteredArchived   = useMemo(() => applyFilters(archivedAll), [archivedAll, priceMinStr, priceMaxStr, areaMinStr, areaMaxStr, sortBy]);

  const itemsForMap = mode === 'owner' ? filteredPublished : filteredPublicOnly;

  const handleDelete = async (id: number) => {
    if (mode !== 'owner' || !authToken) return;
    if (!confirm('Na pewno usunąć?')) return;
    try {
      await fetch(`${API_BASE}/api/v1/listings/${id}`, { method: 'DELETE', headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` } });
      setItems((s) => s.filter((x) => x.id !== id));
    } catch { alert('Nie udało się usunąć ogłoszenia.'); }
  };
  const Actions = ({ id }: { id: number }) =>
    mode !== 'owner' ? null : (
      <div className="flex items-center gap-2">
        <Link href={`/ogloszenia/${id}/edytuj`} className="act-btn edit" title="Edytuj"><Pencil className="w-4 h-4" /></Link>
        <button onClick={() => alert('Promowanie')} className="act-btn promote" title="Promuj"><Star className="w-4 h-4" /></button>
        <button onClick={() => handleDelete(id)} className="act-btn delete" title="Usuń"><Trash2 className="w-4 h-4" /></button>
      </div>
    );

  const displayedUser: OwnerT | null = useMemo(() => {
    if (mode === 'owner')
      return authUser
        ? { name: authUser.name, slug: (authUser as any).slug, avatar: (authUser as any).avatar, role: (authUser as any).role, bio: (authUser as any).bio }
        : null;
    return publicProfileUser || { name: slug, slug: slug, avatar: null };
  }, [mode, authUser, publicProfileUser, slug]);

  const avatarUrl = avatarPathToUrl(displayedUser?.avatar);

  const renderCard = (it: ListingT, keyPrefix: string) => {
    const img = imgSrc(it.images?.[0]?.url ?? null);
    const coords = Number.isFinite(it.lat) && Number.isFinite(it.lng) ? ([Number(it.lat), Number(it.lng)] as [number, number]) : null;
    const status = isArchived(it.status, it.deleted_at) ? 'archived' : isDraft(it.status) ? 'draft' : 'published';
    const statusLabel = status === 'published' ? 'Opublikowane' : status === 'draft' ? 'Szkic' : 'Archiwum';
    return (
      <div key={`${instanceKey}:${keyPrefix}:${it.id}`} className="card-modern overflow-hidden lift"
           onMouseEnter={() => coords && setHoverCoords(coords)} onMouseLeave={() => setHoverCoords(null)}>
        <div className="relative">
          <Link href={`/ogloszenia/${it.id}`} className="block">
            <div className="relative w-full aspect-[4/3] bg-gray-100">
              <Image src={img} alt={it.title} fill className="object-cover"
                     sizes="(max-width:640px) 100vw, (max-width:1280px) 50vw, 33vw" />
            </div>
          </Link>
          {/* badge statusu: owner widzi zawsze, publiczny nie potrzebuje */}
          {mode === 'owner' && (
            <span className={`status-badge status-${status}`}>{statusLabel}</span>
          )}
        </div>
        <div className="p-4 space-y-2">
          <Link href={`/ogloszenia/${it.id}`} className="font-semibold line-clamp-1 hover:underline">{it.title}</Link>
          <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold">
            {fmtPrice(it.price).replace(' PLN', ' zł')}
          </div>
          <div className="text-sm text-gray-600 line-clamp-1">{[it.address_city, it.address_region].filter(Boolean).join(', ')}</div>
          <div className="pt-2 flex items-center justify-between">
            <div className="text-xs text-gray-500">{it.area ? `${it.area} m²` : '—'}</div>
            <Actions id={it.id} />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="container-page py-8 md:py-12 space-y-6">
        <div>Ładowanie danych profilu...</div>
      </main>
    );
  }

  return (
    <main className="container-page py-8 md:py-12 space-y-6">
      <section className="hero-gradient rounded-2xl ring-1 ring-gray-200/70 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="shrink-0">
            <Image
              src={avatarUrl || `data:image/svg+xml;utf8,${encodeURIComponent(`<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y="0" x2="1" y="1"><stop offset="0" stop-color="#2b2f39"/><stop offset="1" stop-color="#1f232b"/></linearGradient></defs><circle cx="128" cy="128" r="124" fill="url(#g)"/><circle cx="128" cy="104" r="36" fill="#e6e9ef"/><path d="M64 188c10-26 36-40 64-40s54 14 64 40v12H64z" fill="#cfd5df"/></svg>`)}`}
              alt={displayedUser?.name || 'Avatar'}
              width={96} height={96} className="block object-cover rounded-full ring-1 ring-black/5" priority
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {displayedUser?.name || displayedUser?.slug || slug}
              </h1>
              <span className="px-2 py-1 rounded-full text-xs bg-white/70 text-gray-700 capitalize ring-1 ring-gray-200">
                {mode === 'owner' ? (displayedUser?.role || 'Osoba Prywatna') : 'Profil publiczny'}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-700">
              {mode === 'owner' ? (displayedUser?.bio || 'Tu może pojawić się Twoje bio.') : 'Ogłoszenia użytkownika. Kontakt w szczegółach ogłoszenia.'}
            </p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-[520px]">
              <div className="rounded-2xl border border-gray-200/70 bg-white/70 p-3">
                <div className="text-xs text-gray-500">Ogółem ogłoszeń</div>
                <div className="text-xl font-bold">{items.length}</div>
              </div>
              {mode === 'owner' ? (
                <>
                  <div className="rounded-2xl border border-gray-200/70 bg-white/70 p-3">
                    <div className="text-xs text-gray-500">Opublikowane</div>
                    <div className="text-xl font-bold">{publishedAll.length}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200/70 bg-white/70 p-3">
                    <div className="text-xs text-gray-500">Szkice</div>
                    <div className="text-xl font-bold">{draftsAll.length}</div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-gray-200/70 bg-white/70 p-3">
                  <div className="text-xs text-gray-500">Z lokalizacją</div>
                  <div className="text-xl font-bold">
                    {items.filter((it) => Number.isFinite(it.lat) && Number.isFinite(it.lng)).length}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {(mode === 'owner' ? filteredPublished.length > 0 : filteredPublicOnly.length > 0) && (
        <section className="rounded-2xl ring-1 ring-gray-200/70 overflow-hidden shadow-sm">
          {/* na mapie w ownerze pokazujemy tylko opublikowane */}
          <MapBoard items={itemsForMap} focusCoords={hoverCoords} key={instanceKey} />
        </section>
      )}

      <section className="rounded-2xl ring-1 ring-gray-200/70 bg-white faded-bg p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-3 justify-between">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1 max-w-[900px]">
            <input className="input-modern" placeholder="Cena od (PLN)" value={priceMinStr} onChange={(e) => setPriceMin(fmtDots(e.target.value))} />
            <input className="input-modern" placeholder="Cena do (PLN)" value={priceMaxStr} onChange={(e) => setPriceMax(fmtDots(e.target.value))} />
            <input className="input-modern" placeholder="Pow. od (m²)" value={areaMinStr} onChange={(e) => setAreaMin(fmtDots(e.target.value))} />
            <input className="input-modern" placeholder="Pow. do (m²)" value={areaMaxStr} onChange={(e) => setAreaMax(fmtDots(e.target.value))} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select className="input-modern" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} title="Sortuj">
              <option value="date_desc">Data: najnowsze</option>
              <option value="date_asc">Data: najstarsze</option>
              <option value="price_asc">Cena: od najniższej</option>
              <option value="price_desc">Cena: od najwyższej</option>
              <option value="area_asc">Powierzchnia: od najmniejszej</option>
              <option value="area_desc">Powierzchnia: od największej</option>
            </select>
            <button className={`icon-toggle ${view === 'grid' ? 'is-active' : ''}`} onClick={() => setView('grid')} title="Widok siatki"><Grid className="w-4 h-4" /></button>
            <button className={`icon-toggle ${view === 'list' ? 'is-active' : ''}`} onClick={() => setView('list')} title="Widok listy"><ListIcon className="w-4 h-4" /></button>
          </div>
        </div>
      </section>

      {/* ===== LISTY ===== */}
      {mode === 'public' ? (
        <section className="space-y-4">
          <div className="text-sm text-gray-600">Wyniki: {filteredPublicOnly.length} / {items.length}</div>
          {err && !loading && <div className="text-red-600">{err}</div>}
          {!loading && !err && filteredPublicOnly.length === 0 && <div className="text-gray-600">Brak ogłoszeń do wyświetlenia.</div>}

          {view === 'grid' && filteredPublicOnly.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 [@media(min-width:1024px)]:[grid-template-columns:repeat(3,minmax(0,1fr))] 2xl:[grid-template-columns:repeat(4,minmax(0,1fr))] gap-4">
              {filteredPublicOnly.map((it) => renderCard(it, 'grid'))}
            </div>
          )}
          {view === 'list' && filteredPublicOnly.length > 0 && (
            <div className="space-y-3">
              {filteredPublicOnly.map((it) => {
                const img = imgSrc(it.images?.[0]?.url ?? null);
                const coords = Number.isFinite(it.lat) && Number.isFinite(it.lng) ? ([Number(it.lat), Number(it.lng)] as [number, number]) : null;
                return (
                  <div key={`${instanceKey}:list:${it.id}`} className="card-modern p-3 md:p-4 flex items-stretch gap-4 lift"
                       onMouseEnter={() => coords && setHoverCoords(coords)} onMouseLeave={() => setHoverCoords(null)}>
                    <Link href={`/ogloszenia/${it.id}`} className="relative w-32 h-24 md:w-48 md:h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <Image src={img} alt={it.title} fill className="object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <Link href={`/ogloszenia/${it.id}`} className="font-semibold text-lg hover:underline line-clamp-1 flex-1">{it.title}</Link>
                      </div>
                      <div className="text-blue-600 font-bold mt-1">{fmtPrice(it.price)}</div>
                      <div className="text-sm text-gray-600 line-clamp-1">{[it.address_city, it.address_region].filter(Boolean).join(', ')}</div>
                      <div className="mt-1 text-xs text-gray-500">{it.area ? `${it.area} m²` : '—'} • ID: #{it.id}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Opublikowane */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold">Opublikowane ({filteredPublished.length})</h2>
            {filteredPublished.length === 0 && <div className="text-gray-600">Brak opublikowanych ogłoszeń.</div>}
            {view === 'grid' && filteredPublished.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 [@media(min-width:1024px)]:[grid-template-columns:repeat(3,minmax(0,1fr))] 2xl:[grid-template-columns:repeat(4,minmax(0,1fr))] gap-4">
                {filteredPublished.map((it) => renderCard(it, 'grid-pub'))}
              </div>
            )}
            {view === 'list' && filteredPublished.length > 0 && (
              <div className="space-y-3">
                {filteredPublished.map((it) => {
                  const img = imgSrc(it.images?.[0]?.url ?? null);
                  const coords = Number.isFinite(it.lat) && Number.isFinite(it.lng) ? ([Number(it.lat), Number(it.lng)] as [number, number]) : null;
                  return (
                    <div key={`${instanceKey}:list-pub:${it.id}`} className="card-modern p-3 md:p-4 flex items-stretch gap-4 lift"
                         onMouseEnter={() => coords && setHoverCoords(coords)} onMouseLeave={() => setHoverCoords(null)}>
                      <Link href={`/ogloszenia/${it.id}`} className="relative w-32 h-24 md:w-48 md:h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        <Image src={img} alt={it.title} fill className="object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <Link href={`/ogloszenia/${it.id}`} className="font-semibold text-lg hover:underline line-clamp-1 flex-1">{it.title}</Link>
                          <div className="ml-auto"><Actions id={it.id} /></div>
                        </div>
                        <div className="text-blue-600 font-bold mt-1">{fmtPrice(it.price)}</div>
                        <div className="text-sm text-gray-600 line-clamp-1">{[it.address_city, it.address_region].filter(Boolean).join(', ')}</div>
                        <div className="mt-1 text-xs text-gray-500">{it.area ? `${it.area} m²` : '—'} • ID: #{it.id}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Szkice */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold">Szkice ({filteredDrafts.length})</h2>
            {filteredDrafts.length === 0 && <div className="text-gray-600">Brak szkiców.</div>}
            {view === 'grid' && filteredDrafts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 [@media(min-width:1024px)]:[grid-template-columns:repeat(3,minmax(0,1fr))] 2xl:[grid-template-columns:repeat(4,minmax(0,1fr))] gap-4">
                {filteredDrafts.map((it) => renderCard(it, 'grid-draft'))}
              </div>
            )}
            {view === 'list' && filteredDrafts.length > 0 && (
              <div className="space-y-3">
                {filteredDrafts.map((it) => {
                  const img = imgSrc(it.images?.[0]?.url ?? null);
                  const coords = Number.isFinite(it.lat) && Number.isFinite(it.lng) ? ([Number(it.lat), Number(it.lng)] as [number, number]) : null;
                  return (
                    <div key={`${instanceKey}:list-draft:${it.id}`} className="card-modern p-3 md:p-4 flex items-stretch gap-4 lift"
                         onMouseEnter={() => coords && setHoverCoords(coords)} onMouseLeave={() => setHoverCoords(null)}>
                      <Link href={`/ogloszenia/${it.id}`} className="relative w-32 h-24 md:w-48 md:h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        <Image src={img} alt={it.title} fill className="object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <Link href={`/ogloszenia/${it.id}`} className="font-semibold text-lg hover:underline line-clamp-1 flex-1">{it.title}</Link>
                          <div className="ml-auto"><Actions id={it.id} /></div>
                        </div>
                        <div className="text-blue-600 font-bold mt-1">{fmtPrice(it.price)}</div>
                        <div className="text-sm text-gray-600 line-clamp-1">{[it.address_city, it.address_region].filter(Boolean).join(', ')}</div>
                        <div className="mt-1 text-xs text-gray-500">{it.area ? `${it.area} m²` : '—'} • ID: #{it.id}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* (opcjonalnie) Archiwum */}
          {filteredArchived.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold">Archiwum ({filteredArchived.length})</h2>
              {view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 [@media(min-width:1024px)]:[grid-template-columns:repeat(3,minmax(0,1fr))] 2xl:[grid-template-columns:repeat(4,minmax(0,1fr))] gap-4">
                  {filteredArchived.map((it) => renderCard(it, 'grid-arch'))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredArchived.map((it) => {
                    const img = imgSrc(it.images?.[0]?.url ?? null);
                    return (
                      <div key={`${instanceKey}:list-arch:${it.id}`} className="card-modern p-3 md:p-4 flex items-stretch gap-4 lift">
                        <Link href={`/ogloszenia/${it.id}`} className="relative w-32 h-24 md:w-48 md:h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          <Image src={img} alt={it.title} fill className="object-cover" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <Link href={`/ogloszenia/${it.id}`} className="font-semibold text-lg hover:underline line-clamp-1 flex-1">{it.title}</Link>
                            <div className="ml-auto"><Actions id={it.id} /></div>
                          </div>
                          <div className="text-blue-600 font-bold mt-1">{fmtPrice(it.price)}</div>
                          <div className="text-sm text-gray-600 line-clamp-1">{[it.address_city, it.address_region].filter(Boolean).join(', ')}</div>
                          <div className="mt-1 text-xs text-gray-500">{it.area ? `${it.area} m²` : '—'} • ID: #{it.id}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
