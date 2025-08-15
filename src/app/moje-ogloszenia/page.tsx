'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
// Tylko CSS – JS Leafleta ładujemy dynamicznie w useEffect
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Grid, List as ListIcon, Pencil, Star, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/* ================= CSS – 1x wstrzyknięcie ================= */
function ensurePageCss() {
  if (typeof document === 'undefined' || document.getElementById('mylistings-css')) return;
  const s = document.createElement('style');
  s.id = 'mylistings-css';
  s.textContent = `
  /* tło sekcji */
  .faded-bg {
    background:
      radial-gradient(120% 140% at 0% 0%, rgba(59,130,246,.08) 0%, rgba(59,130,246,0) 55%),
      radial-gradient(140% 120% at 100% 0%, rgba(234,179,8,.07) 0%, rgba(234,179,8,0) 55%),
      radial-gradient(130% 130% at 80% 100%, rgba(14,165,233,.10) 0%, rgba(14,165,233,0) 60%);
  }
  .hero-gradient {
    background:
      linear-gradient(180deg, rgba(241,245,249,0.65) 0%, rgba(255,255,255,0.6) 100%),
      radial-gradient(80% 120% at 0% 0%, rgba(59,130,246,.12) 0%, rgba(59,130,246,0) 55%),
      radial-gradient(100% 140% at 100% 0%, rgba(234,179,8,.10) 0%, rgba(234,179,8,0) 55%),
      radial-gradient(120% 120% at 100% 100%, rgba(14,165,233,.12) 0%, rgba(14,165,233,0) 60%);
    backdrop-filter: blur(4px);
  }

  /* popup Leafleta – chowamy wrapper i „dzióbek”, zostawiamy tylko naszą kartę */
  .leaflet-popup-content-wrapper,
  .leaflet-popup-tip {
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
  }
  .leaflet-popup-content { margin: 0 !important; }
  .leaflet-popup-close-button { display: none !important; } /* wstawiamy własny X */

  .popup-card {
    width: 340px; max-width: calc(100vw - 40px);
    border-radius: 16px; overflow: hidden; background:#fff;
    box-shadow: 0 16px 40px rgba(15,23,42,.22);
    border:1px solid rgba(148,163,184,.35);
    position: relative;
  }
  .popup-close {
    position:absolute; top:8px; right:8px;
    width:30px;height:30px;border-radius:10px;
    display:flex;align-items:center;justify-content:center;
    border:1px solid rgba(148,163,184,.35);
    background:#fff; color:#334155;
    box-shadow:0 4px 12px rgba(15,23,42,.12);
    transition: transform .15s ease, box-shadow .2s ease, background .2s ease, color .2s ease;
  }
  .popup-close:hover { transform: translateY(-1px) rotate(6deg); background:#f8fafc; }

  .popup-head { display:flex; gap:12px; padding:12px 12px 0 12px; }
  .popup-img { width:92px; height:70px; border-radius:10px; overflow:hidden; background:#f1f5f9; flex-shrink:0; }
  .popup-title { font-weight:800; font-size:15px; line-height:1.25; color:#0f172a; margin-bottom:4px; }
  .popup-loc { font-size:12px; color:#64748b; display:flex; gap:6px; align-items:center; }

  .price-badge { background:#f59e0b; color:#fff; font-weight:800; font-size:16px; border-radius:10px; padding:6px 10px; display:inline-block; margin:10px 12px; }

  .popup-meta { display:flex; gap:10px; padding:0 12px 12px 12px; }
  .popup-chip {
    display:flex; align-items:center; gap:6px; font-size:12px; color:#334155;
    padding:6px 10px; border-radius:10px; background:#f8fafc; border:1px solid rgba(148,163,184,.35);
  }

  /* marker cluster – lekki amber */
  .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large { background: rgba(245,158,11,.22); }
  .marker-cluster div { background:#f59e0b; color:#fff; border:3px solid #fff; box-shadow:0 2px 6px rgba(15,23,42,.15); }

  /* animowany pin */
  .soft-pin{position:relative;width:44px;height:60px;pointer-events:none;}
  .soft-pin .pin-svg{display:block;width:40px;height:56px;margin:0 auto; transform-origin:50% 90%; animation:pinBob 1.5s ease-in-out infinite;}
  .soft-pin .shadow{position:absolute;left:50%;bottom:4px;width:36px;height:12px;background: radial-gradient(ellipse at center, rgba(15,23,42,.22) 0%, rgba(15,23,42,0) 70%);}
  .soft-pin .ring{position:absolute;left:50%;top:38px;width:18px;height:18px;border-radius:50%;background:#ff8a00c2;transform:translate(-50%,-50%) scale(.6);animation:ringPulse 1.5s ease-out infinite;}
  @keyframes pinBob{0%{transform:translateY(0)}50%{transform:translateY(-4px)}100%{transform:translateY(0)}}
  @keyframes ringPulse{0%{opacity:.55;transform:translate(-50%,-50%) scale(.6)}70%{opacity:0;transform:translate(-50%,-50%) scale(2.2)}100%{opacity:0;transform:translate(-50%,-50%) scale(2.2)}}

  /* przełączniki widoku, akcje, hover kart */
  .icon-toggle {
    width: 38px; height: 38px; border-radius: 12px;
    display:flex; align-items:center; justify-content:center;
    border:1px solid rgba(148,163,184,.35);
    background:#fff; box-shadow: 0 2px 6px rgba(15,23,42,.06);
    transition: transform .15s ease, box-shadow .2s ease, background .2s ease, color .2s ease, border-color .2s ease;
    color:#334155;
  }
  .icon-toggle:hover { background:#f8fafc; transform: translateY(-1px); }
  .icon-toggle.is-active { background:#1d4ed8; color:white; border-color:transparent; }

  .act-btn {
    width: 38px; height: 38px; border-radius: 9999px;
    display:flex; align-items:center; justify-content:center;
    border:1px solid rgba(148,163,184,.35);
    background:#fff; color:#64748b;
    transition: transform .15s ease, box-shadow .2s ease, color .2s ease, border-color .2s ease, background .2s ease;
    box-shadow: 0 2px 6px rgba(15,23,42,.06);
  }
  .act-btn:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(15,23,42,.12); }
  .act-btn.edit:hover { color:#1d4ed8; border-color:#1d4ed8; background:#eef2ff; }
  .act-btn.promote:hover { color:#b45309; border-color:#f59e0b; background:#fff7ed; }
  .act-btn.delete:hover { color:#b91c1c; border-color:#f43f5e; background:#fff1f2; }

  .lift { transition: transform .15s ease, box-shadow .2s ease; }
  .lift:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(15,23,42,.12); }
  `;
  document.head.appendChild(s);
}

/* ================= helpers ================= */
type ImageT = { id: number; url: string; order: number; };
type Listing = {
  id: number;
  title: string;
  price: number | null;     // grosze
  address_city: string | null;
  address_region: string | null;
  lat: number | null;
  lng: number | null;
  images: ImageT[];
  created_at: string | null;
  area: number | null;
};

const PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>
  <rect width='100%' height='100%' fill='#f1f5f9'/>
  <g fill='#94a3b8' font-family='Arial, Helvetica, sans-serif' font-size='22'>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'>Brak zdjęcia</text>
  </g>
</svg>
`)}`;

function imgUrl(u?: string | null) {
  if (!u) return PLACEHOLDER;
  if (/^https?:\/\//i.test(u)) return u;
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
  return `${base}/${u.replace(/^\/+/, '')}`;
}
const onlyDigits = (s: string) => (s || '').replace(/\D+/g, '');
const fmtDots = (n: string) => n.replace(/\D/g, '').replace(/^0+/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const parseDots = (s: string) => { const d = onlyDigits(s); return d ? Number(d) : 0; };
const fmtPrice = (g?: number | null) => (g == null ? '—' : `${(g / 100).toLocaleString('pl-PL')} PLN`);

/* ================= Popup HTML ================= */
function popupHtml(l: Listing) {
  const img = imgUrl(l.images?.[0]?.url ?? null);
  const price = fmtPrice(l.price).replace(' PLN', ' zł');
  const loc = [l.address_city, l.address_region].filter(Boolean).join(', ');
  const m2 = l.area ? `${l.area} m²` : '—';
  const ppm = l.price && l.area ? `${Math.round(l.price / l.area).toLocaleString('pl-PL')} zł za m²` : '—';

  const esc = (s: string) => s?.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') ?? '';
  return `
    <div class="popup-card">
      <button class="popup-close" aria-label="Zamknij">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 6l12 12M18 6L6 18" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <div class="popup-head">
        <a class="popup-imglink popup-img" href="/ogloszenia/${l.id}">
          <img src="${img}" alt="" style="width:100%;height:100%;object-fit:cover"/>
        </a>
        <div style="min-width:0">
          <div class="popup-title">${esc(l.title)}</div>
          <div class="popup-loc">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11Z" stroke="#64748b" stroke-width="1.8"/><circle cx="12" cy="10" r="2.8" fill="#64748b"/></svg>
            <span>${esc(loc || '—')}</span>
          </div>
        </div>
      </div>
      <div class="price-badge">${price}</div>
      <div class="popup-meta">
        <div class="popup-chip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" stroke="#0f172a" stroke-width="1.6"/><path d="M4 10h16M10 4v16" stroke="#0f172a" stroke-width="1.6"/></svg>
          ${m2}
        </div>
        <div class="popup-chip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12h14M3 6h18M3 18h10" stroke="#0f172a" stroke-width="1.6" stroke-linecap="round"/></svg>
          ${ppm}
        </div>
      </div>
    </div>`;
}

/* ============== MAPA (Leaflet + clusters/spiderfy – dynamic import) ============== */

function MapBoard({ items, focusCoords }: { items: Listing[]; focusCoords: [number, number] | null; }) {
  const mapRef = useRef<any>(null);
  const clusterRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const pinIconRef = useRef<any>(null);

  useEffect(() => { ensurePageCss(); }, []);

  // init Leaflet
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const { default: Leaflet } = await import('leaflet');
      (window as any).L = Leaflet;            // plugin będzie wiedział, gdzie się podpiąć
      await import('leaflet.markercluster/dist/leaflet.markercluster.js');

      if (cancelled) return;

      LRef.current = Leaflet;
      pinIconRef.current = Leaflet.divIcon({
        className: 'soft-pin',
        html: `
          <span class="ring"></span>
          <svg viewBox="0 0 48 64" class="pin-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M24 2C13.4 2 4.8 10.6 4.8 21.2C4.8 34.9 24 62 24 62C24 62 43.2 34.9 43.2 21.2C43.2 10.6 34.6 2 24 2Z" fill="#FF8A00"/>
            <circle cx="24" cy="22" r="8.5" fill="#ffffff"/>
          </svg>
          <span class="shadow"></span>
        `,
        iconSize: [44, 60], iconAnchor: [22, 58],
      });

      const el = mapDivRef.current!;
      // @ts-ignore — higiena HMR
      if ((el as any)?._leaflet_id) { el.innerHTML=''; delete (el as any)._leaflet_id; }

      const map = Leaflet.map(el, {
        center: [52.237049, 21.017532],
        zoom: 6,
        zoomControl: false,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      // 🇵🇱 Tiles z polskimi etykietami (MapTiler lang=pl jeśli masz klucz, inaczej OSM)
      const MT = (process.env.NEXT_PUBLIC_MAPTILER_KEY || '').trim();
      if (MT) {
        Leaflet.tileLayer(
          `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MT}&lang=pl`,
          { attribution: '&copy; MapTiler & OpenStreetMap' }
        ).addTo(map);
      } else {
        // Fallback – OSM standard (lokalne nazwy)
        Leaflet.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          { attribution: '&copy; OpenStreetMap' }
        ).addTo(map);
      }

      Leaflet.control.zoom({ position: 'bottomright' }).addTo(map);

      const cluster = (Leaflet as any).markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnEveryZoom: true,
        disableClusteringAtZoom: 16,
        spiderLegPolylineOptions: { weight: 1.2, color: '#64748b', opacity: 0.85 },
        maxClusterRadius: 50,
      });
      clusterRef.current = cluster;
      map.addLayer(cluster);

      setTimeout(() => map.invalidateSize(), 120);
    }

    boot();

    return () => {
      cancelled = true;
      try {
        clusterRef.current?.clearLayers();
        mapRef.current?.off();
        mapRef.current?.remove();
      } catch {}
      mapRef.current = null;
      clusterRef.current = null;
      LRef.current = null;
    };
  }, []);

  // markers
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    const cluster = clusterRef.current;
    const pinIcon = pinIconRef.current;
    if (!L || !map || !cluster || !pinIcon) return;

    cluster.clearLayers();

    const bounds: [number, number][] = [];
    items.forEach((l) => {
      const lat = Number(l.lat), lng = Number(l.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const marker = L.marker([lat, lng], { icon: pinIcon });
      marker.bindPopup(popupHtml(l), { className: 'no-tailwind' });

      // nasz „X” w popupie
      marker.on('popupopen', (e: any) => {
        const popEl = e?.popup?.getElement?.();
        const btn = popEl?.querySelector?.('.popup-close') as HTMLButtonElement | null;
        if (btn) btn.onclick = () => map.closePopup();
      });

      cluster.addLayer(marker);
      bounds.push([lat, lng]);
    });

    if (bounds.length) {
      try { map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] }); } catch {}
    }
  }, [items]);

  // zewnętrzne „focus” (hover z listy/grida)
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !focusCoords) return;
    map.flyTo(focusCoords, Math.max(map.getZoom(), 13), { duration: 0.8, easeLinearity: 0.25 });
  }, [focusCoords]);

  return (
    <div ref={mapDivRef} className="rounded-2xl overflow-hidden ring-1 ring-gray-200/70 shadow-sm h-[420px]" />
  );
}

/* ===================== PAGE ===================== */
type SortKey = 'date_desc' | 'date_asc' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc';

export default function MyListingsShowcasePage() {
  const { user, token, isLoading } = useAuth();

  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortKey>('date_desc');

  const [priceMinStr, setPriceMinStr] = useState('');
  const [priceMaxStr, setPriceMaxStr] = useState('');
  const [areaMinStr, setAreaMinStr] = useState('');
  const [areaMaxStr, setAreaMaxStr] = useState('');

  // współrzędne „focus” dla MapBoard (hover)
  const [hoverCoords, setHoverCoords] = useState<[number, number] | null>(null);

  useEffect(() => { ensurePageCss(); }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user || !token) return;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/my-listings`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Nie udało się pobrać ogłoszeń');
        const payload = await res.json();
        const data = Array.isArray(payload?.data) ? payload.data : payload;

        const normalized: Listing[] = (data || []).map((l: any, idx: number) => ({
          id: Number(l.id),
          title: String(l.title ?? `Ogłoszenie #${idx + 1}`),
          price: typeof l.price === 'number' ? l.price : Number(l.price ?? 0),
          address_city: l.address_city ?? null,
          address_region: l.address_region ?? null,
          lat: l?.lat ?? l?.latitude ?? l?.geo_lat ?? null,
          lng: l?.lng ?? l?.longitude ?? l?.geo_lng ?? null,
          images: Array.isArray(l.images)
            ? l.images
                .map((img: any, i: number) => ({
                  id: Number(img?.id ?? i),
                  url: img?.url ?? img?.full_url ?? img?.image_url ?? img?.original_url ?? img?.path ?? img?.file_path ?? img?.filename ?? '',
                  order: Number(img?.order ?? i + 1),
                }))
                .sort((a: ImageT, b: ImageT) => (a.order ?? 0) - (b.order ?? 0))
            : [],
          created_at: l?.created_at ?? null,
          area: typeof l?.area === 'number' ? l.area : Number(l?.area ?? 0),
        }));

        setItems(normalized);
      } catch (e: any) {
        setErr(e.message || 'Błąd');
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoading, user, token]);

  const filtered = useMemo(() => {
    const pMin = parseDots(priceMinStr);
    const pMax = parseDots(priceMaxStr);
    const aMin = parseDots(areaMinStr);
    const aMax = parseDots(areaMaxStr);

    let arr = items.slice();
    if (pMin) arr = arr.filter((x) => (x.price ?? 0) / 100 >= pMin);
    if (pMax) arr = arr.filter((x) => (x.price ?? 0) / 100 <= pMax);
    if (aMin) arr = arr.filter((x) => (x.area ?? 0) >= aMin);
    if (aMax) arr = arr.filter((x) => (x.area ?? 0) <= aMax);

    arr.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc': return (b.created_at || '').localeCompare(a.created_at || '');
        case 'date_asc':  return (a.created_at || '').localeCompare(b.created_at || '');
        case 'price_asc': return (a.price ?? 0) - (b.price ?? 0);
        case 'price_desc':return (b.price ?? 0) - (a.price ?? 0);
        case 'area_asc':  return (a.area ?? 0) - (b.area ?? 0);
        case 'area_desc': return (b.area ?? 0) - (a.area ?? 0);
        default: return 0;
      }
    });
    return arr;
  }, [items, priceMinStr, priceMaxStr, areaMinStr, areaMaxStr, sortBy]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm('Na pewno usunąć to ogłoszenie?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/listings/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Błąd usuwania');
      setItems((s) => s.filter((x) => x.id !== id));
    } catch {
      alert('Nie udało się usunąć ogłoszenia.');
    }
  };

  const Actions = ({ id }: { id: number }) => (
    <div className="flex items-center gap-2">
      <Link href={`/ogloszenia/${id}/edytuj`} className="act-btn edit" title="Edytuj">
        <Pencil className="w-4 h-4" />
      </Link>
      <button onClick={() => alert('Tu wepniesz promowanie')} className="act-btn promote" title="Promuj">
        <Star className="w-4 h-4" />
      </button>
      <button onClick={() => handleDelete(id)} className="act-btn delete" title="Usuń">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  if (isLoading) return <main className="container-page py-10">Ładowanie…</main>;
  if (!user) return null;

  const avatar = (user as any)?.avatar || null;
  const role = (user as any)?.role || 'Osoba Prywatna';
  const phone = (user as any)?.phone || (user as any)?.phone_number || '';
  const email = user.email ?? '';

  return (
    <main className="container-page py-8 md:py-12 space-y-6">
      {/* HERO – gradient, wycentrowane, dopieszczone */}
      <section className="hero-gradient rounded-2xl ring-1 ring-gray-200/70 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-black/5 shrink-0">
            <Image src={imgUrl(avatar)} alt={user?.name || 'Avatar'} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{user?.name || 'Użytkownik'}</h1>
              <span className="px-2 py-1 rounded-full text-xs bg-white/70 text-gray-700 capitalize ring-1 ring-gray-200"> {role} </span>
            </div>
            <p className="mt-2 text-sm text-gray-700">
              {((user as any)?.bio as string) || 'Tu może pojawić się Twoje bio – dodaj je w ustawieniach profilu.'}
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="input-group">
                <input className="input-modern input-readonly" value={phone || 'Brak numeru telefonu'} readOnly />
                <span className="input-suffix">Telefon</span>
              </div>
              <div className="input-group">
                <input className="input-modern input-readonly" value={email || 'Brak e-mail'} readOnly />
                <span className="input-suffix">E-mail</span>
              </div>
              <div className="flex items-stretch gap-3">
                <div className="flex-1 rounded-2xl border border-gray-200/70 bg-white/70 p-3">
                  <div className="text-xs text-gray-500 mb-1">Ogłoszenia</div>
                  <div className="text-xl font-bold">{items.length}</div>
                </div>
                <div className="flex-1 rounded-2xl border border-gray-200/70 bg-white/70 p-3">
                  <div className="text-xs text-gray-500 mb-1">Z lokalizacją</div>
                  <div className="text-xl font-bold">
                    {items.filter(it => Number.isFinite(it.lat) && Number.isFinite(it.lng)).length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAPA */}
      <section className="rounded-2xl ring-1 ring-gray-200/70 overflow-hidden shadow-sm">
        <MapBoard items={items} focusCoords={hoverCoords} />
      </section>

      {/* FILTRY + Sort + Widok (po PRAWEJ) */}
      <section className="rounded-2xl ring-1 ring-gray-200/70 bg-white faded-bg p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-3 justify-between">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1 max-w-[900px]">
            <input className="input-modern" placeholder="Cena od (PLN)" value={priceMinStr} onChange={(e) => setPriceMinStr(fmtDots(e.target.value))} />
            <input className="input-modern" placeholder="Cena do (PLN)" value={priceMaxStr} onChange={(e) => setPriceMaxStr(fmtDots(e.target.value))} />
            <input className="input-modern" placeholder="Pow. od (m²)" value={areaMinStr} onChange={(e) => setAreaMinStr(fmtDots(e.target.value))} />
            <input className="input-modern" placeholder="Pow. do (m²)" value={areaMaxStr} onChange={(e) => setAreaMaxStr(fmtDots(e.target.value))} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select className="input-modern" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} title="Sortuj">
              <option value="date_desc">Data: najnowsze</option>
              <option value="date_asc">Data: najstarsze</option>
              <option value="price_asc">Cena: od najniższej</option>
              <option value="price_desc">Cena: od najwyższej</option>
              <option value="area_asc">Powierzchnia: od najmniejszej</option>
              <option value="area_desc">Powierzchnia: od największej</option>
            </select>
            <button className={`icon-toggle ${view === 'grid' ? 'is-active' : ''}`} onClick={() => setView('grid')} title="Widok siatki">
              <Grid className="w-4 h-4" />
            </button>
            <button className={`icon-toggle ${view === 'list' ? 'is-active' : ''}`} onClick={() => setView('list')} title="Widok listy">
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* LISTY / GRID */}
      <section className="space-y-4">
        <div className="text-sm text-gray-600">Wyniki: {filtered.length} / {items.length}</div>

        {view === 'grid' && (
           <div className="grid grid-cols-1 sm:grid-cols-2 [@media(min-width:1024px)]:[grid-template-columns:repeat(3,minmax(0,1fr))] 2xl:[grid-template-columns:repeat(4,minmax(0,1fr))] gap-4">
            {filtered.map((it) => {
              const img = imgUrl(it.images?.[0]?.url ?? null);
              const coords = (Number.isFinite(it.lat) && Number.isFinite(it.lng)) ? [Number(it.lat), Number(it.lng)] as [number, number] : null;
              return (
                <div
                  key={it.id}
                  className="card-modern overflow-hidden lift"
                  onMouseEnter={() => coords && setHoverCoords(coords)}
                  onMouseLeave={() => setHoverCoords(null)}
                >
                  <Link href={`/ogloszenia/${it.id}`} className="block">
                    <div className="relative w-full aspect-[4/3] bg-gray-100">
                      <Image src={img} alt={it.title} fill className="object-cover" sizes="(max-width:640px) 100vw, (max-width:1280px) 50vw, 33vw" />
                    </div>
                  </Link>
                  <div className="p-4 space-y-2">
                    <Link href={`/ogloszenia/${it.id}`} className="font-semibold line-clamp-1 hover:underline">
                      {it.title}
                    </Link>
                    <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold">
                      {fmtPrice(it.price).replace(' PLN',' zł')}
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-1">
                      {[it.address_city, it.address_region].filter(Boolean).join(', ')}
                    </div>
                    <div className="pt-2 flex items-center justify-between">
                      <div className="text-xs text-gray-500">{it.area ? `${it.area} m²` : '—'}</div>
                      <Actions id={it.id} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'list' && (
          <div className="space-y-3">
            {filtered.map((it) => {
              const img = imgUrl(it.images?.[0]?.url ?? null);
              const coords = (Number.isFinite(it.lat) && Number.isFinite(it.lng)) ? [Number(it.lat), Number(it.lng)] as [number, number] : null;
              return (
                <div
                  key={it.id}
                  className="card-modern p-3 md:p-4 flex items-stretch gap-4 lift"
                  onMouseEnter={() => coords && setHoverCoords(coords)}
                  onMouseLeave={() => setHoverCoords(null)}
                >
                  <Link href={`/ogloszenia/${it.id}`} className="relative w-32 h-24 md:w-48 md:h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <Image src={img} alt={it.title} fill className="object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <Link href={`/ogloszenia/${it.id}`} className="font-semibold text-lg hover:underline line-clamp-1 flex-1">
                        {it.title}
                      </Link>
                      <div className="ml-auto"><Actions id={it.id} /></div>
                    </div>
                    <div className="text-blue-600 font-bold mt-1">{fmtPrice(it.price)}</div>
                    <div className="text-sm text-gray-600 line-clamp-1">
                      {[it.address_city, it.address_region].filter(Boolean).join(', ')}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {it.area ? `${it.area} m²` : '—'} • ID: #{it.id}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
