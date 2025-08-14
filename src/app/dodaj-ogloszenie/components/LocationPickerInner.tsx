'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import L, { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ===========================================================
   CSS dla stylowego markera
   =========================================================== */
function ensureMarkerCss() {
  if (typeof document === 'undefined' || document.getElementById('soft-pin-css')) return;
  const el = document.createElement('style');
  el.id = 'soft-pin-css';
  el.textContent = `
  .leaflet-container { background:#f1f5f9; }
  .soft-pin{position:relative;width:44px;height:60px;pointer-events:none;}
  .soft-pin .pin-svg{
    display:block;width:40px;height:56px;margin:0 auto;
    transform-origin:50% 90%;
    animation:pinBob 1.5s ease-in-out infinite;
  }
  .soft-pin .shadow{
    position:absolute;left:50%;bottom:4px;width:36px;height:12px;
    background: radial-gradient(ellipse at center, rgba(15,23,42,.22) 0%, rgba(15,23,42,0) 70%);
  }
  .soft-pin .ring{
    position:absolute;left:50%;top:38px;width:18px;height:18px;border-radius:50%;
    background:#ff8a00c2;transform:translate(-50%,-50%) scale(.6);
    animation:ringPulse 1.5s ease-out infinite;
  }
  @keyframes pinBob{0%{transform:translateY(0)}50%{transform:translateY(-4px)}100%{transform:translateY(0)}}
  @keyframes ringPulse{0%{opacity:.55;transform:translate(-50%,-50%) scale(.6)}70%{opacity:0;transform:translate(-50%,-50%) scale(2.2)}100%{opacity:0;transform:translate(-50%,-50%) scale(2.2)}}
  .leaflet-control-zoom{margin:0 8px 8px 0;}
  .leaflet-control-zoom a{
    border-radius:12px !important;
    box-shadow:0 2px 6px rgba(15,23,42,.08);
    border:1px solid rgba(148,163,184,.35);
    width:36px;height:36px;line-height:34px;
    color:#0f172a;background:#fff;
  }
  .leaflet-control-zoom a:hover{background:#f8fafc;}
  `;
  document.head.appendChild(el);
}

const pinIcon = L.divIcon({
  className: 'soft-pin',
  html: `
    <span class="ring"></span>
    <svg viewBox="0 0 48 64" class="pin-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M24 2C13.4 2 4.8 10.6 4.8 21.2C4.8 34.9 24 62 24 62C24 62 43.2 34.9 43.2 21.2C43.2 10.6 34.6 2 24 2Z" fill="#FF8A00"/>
      <circle cx="24" cy="22" r="8.5" fill="#ffffff"/>
    </svg>
    <span class="shadow"></span>
  `,
  iconSize: [44, 60],
  iconAnchor: [22, 58],
});

/* =========================
   Typy
   ========================= */
type ApiHit = {
  id?: string | number; city?: string; name?: string;
  voivodeship?: string; region?: string; county?: string;
  simc_type?: string; type?: string; lat?: number; lon?: number;
};
type Hit = {
  id: string; name: string; region?: string; county?: string;
  type?: string; lat?: number; lon?: number;
};
type Props = {
  onCityChange: (city: string) => void;
  onRegionChange: (region: string) => void;
  onCoordsChange: (lat: number, lng: number) => void;
  initialCity?: string;
  initialRegion?: string;
  initialCoords?: [number, number] | null;
  street?: string;
  onStreetChange?: (s: string) => void;
  showStreet?: boolean;
};

/* =========================
   Cache wyników
   ========================= */
const memoryCache = new Map<string, Hit[]>();

export default function LocationPickerInner({
  onCityChange,
  onRegionChange,
  onCoordsChange,
  initialCity = '',
  initialRegion = '',
  initialCoords = null,
  street,
  onStreetChange,
  showStreet = true,
}: Props) {
  useEffect(() => { ensureMarkerCss(); }, []);

  const [query, setQuery] = useState<string>(initialCity);
  const [hitsRaw, setHitsRaw] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<[number, number] | null>(initialCoords);
  const [region, setRegion] = useState<string>(initialRegion);
  const [mapZoom, setMapZoom] = useState<number>(initialCoords ? 13 : 6);

  const [localStreet, setLocalStreet] = useState<string>(street ?? '');
  useEffect(() => { if (typeof street === 'string') setLocalStreet(street); }, [street]);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const mapBoxRef = useRef<HTMLDivElement | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
const [mapReady, setMapReady] = useState(false); // NEW
  const abortRef = useRef<AbortController | null>(null);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // dociągnij współrzędne dla initialCity
  useEffect(() => {
    if (coords || !initialCity) return;
    geocodeCity(initialCity, initialRegion).then((c) => {
      if (c) {
        setCoords(c);
        setMapZoom(12);
        onCoordsChange(c[0], c[1]);
      }
    });
  }, [coords, initialCity, initialRegion, onCoordsChange]);

  // zamknij dropdown po kliknięciu poza
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // inicjalizacja mapy (1x) – BEZ react-leaflet
  useEffect(() => {
    const el = mapDivRef.current;
    if (!el) return;

    // higiena StrictMode/HMR – jeśli Leaflet zdążył się już przypiąć do tego diva
    // usuń ślady zanim zainicjalizujemy nową mapę
    // @ts-ignore
    if ((el as any)._leaflet_id) {
      el.innerHTML = '';
      // @ts-ignore
      delete (el as any)._leaflet_id;
    }

    const map = L.map(el, {
      center: coords || [52.237049, 21.017532],
      zoom: mapZoom,
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: false,
    });
    mapRef.current = map;

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors & CARTO',
  detectRetina: true,           // ostrzejsze kafelki na HiDPI
  crossOrigin: true,
}).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // klik na mapie => ustaw pinezkę
    map.on('click', (e: L.LeafletMouseEvent) => {
      const c: [number, number] = [e.latlng.lat, e.latlng.lng];
      setCoords(c);
      onCoordsChange(c[0], c[1]);
    });

    // odśwież pomiar kontenera po animacjach/layoutach
    setTimeout(() => map.invalidateSize(), 200);

    setMapReady(true);
  if (coords) {
    markerRef.current = L.marker(coords, { icon: pinIcon }).addTo(map);
    map.setView(coords, Math.max(mapZoom, map.getZoom()));
  }

    // sprzątanie
return () => {
    map.off();
    map.remove();
    mapRef.current = null;
    setMapReady(false); // NEW
    // @ts-ignore
    if (el && (el as any)._leaflet_id) delete (el as any)._leaflet_id;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // aktualizacje: coords / zoom / marker / flyTo
  useEffect(() => {
    const map = mapRef.current;
   if (!map || !mapReady) return;

    if (coords) {
      if (!markerRef.current) {
        markerRef.current = L.marker(coords, { icon: pinIcon }).addTo(map);
      } else {
        markerRef.current.setLatLng(coords);
      }
      // łagodne przesunięcie widoku
      map.flyTo(coords, Math.max(mapZoom, map.getZoom()), { duration: 1.2, easeLinearity: 0.25 });
    } else {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
  }, [coords, mapZoom]);

  // pobieranie sugestii miast
  useEffect(() => {
    const q = (query ?? '').trim();
    if (q.length < 2) { setHitsRaw([]); setOpen(false); return; }

    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      const key = q.toLowerCase();
      if (memoryCache.has(key)) { setHitsRaw(memoryCache.get(key) || []); setOpen(true); return; }

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const API = (process.env.NEXT_PUBLIC_API_URL ?? '').trim() || 'http://127.0.0.1:8000';
      const base = API.replace(/\/+$/, '');
      const url = `${base}/api/v1/geo/search?q=${encodeURIComponent(q)}&limit=20`;

      try {
        const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const payload = await res.json();
        const raw: ApiHit[] = Array.isArray(payload?.hits)
          ? payload.hits
          : Array.isArray(payload)
          ? payload
          : [];
        const mapped = mapApiHits(raw);
        memoryCache.set(key, mapped);
        setHitsRaw(mapped); setOpen(true);
      } catch {
        try {
          const urlNom = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=15&countrycodes=pl&accept-language=pl&city=${encodeURIComponent(q)}`;
          const res2 = await fetch(urlNom, { signal: ctrl.signal, headers: { 'Accept-Language': 'pl' } });
          if (!res2.ok) throw new Error('HTTP ' + res2.status);
          const data = await res2.json();
          const mapped = mapNominatim(data);
          memoryCache.set(key, mapped);
          setHitsRaw(mapped); setOpen(true);
        } catch {
          setHitsRaw([]); setOpen(true);
        }
      }
    }, 150);

    return () => {
      if (debRef.current) clearTimeout(debRef.current);
      abortRef.current?.abort();
    };
  }, [query]);

  const hits = useMemo(() => {
    const allowed = ['miasto', 'miasto na prawach powiatu', 'część miasta', 'dzielnica', 'osiedle'];
    const list = (hitsRaw ?? []).filter((h) => {
      const okName = typeof h?.name === 'string' && h.name.trim().length > 0;
      if (!okName) return false;
      const t = String(h.type ?? '').toLowerCase();
      return !t || allowed.some((a) => t.includes(a));
    });
    const score = (h: Hit) => {
      const name = String(h.name ?? '').toLocaleLowerCase('pl-PL');
      const voiv = String(h.region ?? '').toLocaleLowerCase('pl-PL');
      const county = String(h.county ?? '').toLocaleLowerCase('pl-PL');
      const q = (query ?? '').trim().toLocaleLowerCase('pl-PL');
      let s = 0;
      if (q && name === q) s += 120;
      if (q && name.startsWith(q)) s += 50;
      const t = String(h.type ?? '').toLowerCase();
      if (t.includes('miasto')) s += 40;
      if (county === name || county.includes('m.') || county.includes('miasto')) s += 25;
      const capitals: Record<string, string> = {
        warszawa: 'mazowieckie', kraków: 'małopolskie', wrocław: 'dolnośląskie',
        poznań: 'wielkopolskie', gdańsk: 'pomorskie', szczecin: 'zachodniopomorskie',
        olsztyn: 'warmińsko-mazurskie', białystok: 'podlaskie', rzeszów: 'podkarpackie',
        lublin: 'lubelskie', kielce: 'świętokrzyskie', katowice: 'śląskie',
        opole: 'opolskie', łódź: 'łódzkie', bydgoszcz: 'kujawsko-pomorskie',
        toruń: 'kujawsko-pomorskie', 'zielona góra': 'lubuskie', 'gorzów wielkopolski': 'lubuskie'
      };
      if (capitals[name] && capitals[name] === voiv) s += 70;
      return s;
    };
    const bestByName = new Map<string, { h: Hit; s: number }>();
    for (const h of list) {
      const key = String(h.name).toLocaleLowerCase('pl-PL');
      const s = score(h);
      const prev = bestByName.get(key);
      if (!prev || s > prev.s) bestByName.set(key, { h, s });
    }
    return Array.from(bestByName.values())
      .map((x) => x.h)
      .sort((a, b) => score(b) - score(a))
      .slice(0, 10);
  }, [hitsRaw, query]);

  async function geocodeCity(city: string, voiv?: string): Promise<[number, number] | null> {
    try {
      const url =
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pl&accept-language=pl&city=${encodeURIComponent(city)}` +
        (voiv ? `&state=${encodeURIComponent(voiv)}` : '');
      const res = await fetch(url, { headers: { 'Accept-Language': 'pl' } });
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat); const lon = parseFloat(data[0].lon);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) return [lat, lon];
      }
    } catch {}
    return null;
  }

  const scrollMapIntoView = () => {
    mapBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // dodatkowe odświeżenie wymiarów
    setTimeout(() => mapRef.current?.invalidateSize(), 50);
  };

  const pick = async (h: Hit) => {
    setQuery(h.name);
    const r = h.region ?? '';
    setRegion(r);
    onCityChange(h.name);
    onRegionChange(r);

    if (h.lat != null && h.lon != null) {
      const c: [number, number] = [h.lat, h.lon];
      setCoords(c); setMapZoom(12); onCoordsChange(c[0], c[1]); scrollMapIntoView();
    } else {
      const c = await geocodeCity(h.name, r);
      if (c) { setCoords(c); setMapZoom(12); onCoordsChange(c[0], c[1]); scrollMapIntoView(); }
    }
    setOpen(false);
  };

  const geocodeStreet = async () => {
    const city = (query ?? '').trim();
    const st = (onStreetChange ? street : localStreet)?.trim() || '';
    if (!city || !st) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=pl&accept-language=pl&street=${encodeURIComponent(st)}&city=${encodeURIComponent(city)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'pl' } });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat); const lon = parseFloat(data[0].lon);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          const c: [number, number] = [lat, lon];
          setCoords(c); setMapZoom(16); onCoordsChange(lat, lon); scrollMapIntoView();
        }
      }
    } catch {}
  };

  const Highlight = ({ text }: { text: string }) => {
    const base = text ?? '';
    const q = (query ?? '').trim();
    if (!q) return <>{base}</>;
    const Lb = base.toLocaleLowerCase('pl-PL');
    const Lq = q.toLocaleLowerCase('pl-PL');
    const i = Lb.indexOf(Lq);
    if (i < 0) return <>{base}</>;
    return (
      <>
        {base.slice(0, i)}
        <span className="font-semibold">{base.slice(i, i + q.length)}</span>
        {base.slice(i + q.length)}
      </>
    );
  };

  return (
    <div ref={rootRef} className="relative">
      {/* Pola formularza */}
      <div className="relative z-50">
        <label className="form-label mb-1.5">Miasto</label>
        <input
          className="input-modern"
          value={query}
          placeholder="Wpisz miasto…"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
        />
        {open && hits.length > 0 && (
          <div className="absolute z-[1000] mt-2 max-h-72 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            {hits.map((h) => (
              <button
                key={h.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
                onClick={() => pick(h)}
              >
                <div className="leading-tight"><Highlight text={h.name} /></div>
                {h.region && <div className="text-[13px] text-gray-500">{h.region}</div>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3">
        <label className="form-label mb-1.5">Województwo</label>
        <input
          className="input-modern input-readonly placeholder:text-gray-400"
          value={region}
          placeholder="Uzupełni się po wyborze miasta"
          readOnly aria-readonly="true"
        />
      </div>

      {showStreet && (
        <div className="mt-3">
          <label className="form-label mb-1.5">Ulica / nr (opcjonalnie)</label>
          <input
            className="input-modern"
            placeholder="np. Mickiewicza 7"
            value={onStreetChange ? (street ?? '') : localStreet}
            onChange={(e) => { if (onStreetChange) onStreetChange(e.target.value); else setLocalStreet(e.target.value); }}
            onBlur={geocodeStreet}
          />
        </div>
      )}

      {/* Mapa */}
      <div
        ref={mapBoxRef}
        className="mt-4 rounded-2xl overflow-hidden ring-1 ring-gray-200/70 shadow-sm relative z-0 h-[clamp(280px,45vh,500px)]"
      >
        <div
          ref={mapDivRef}
          style={{ height: '500px', width: '100%' }}
        />
        <p className="map-credit">
  Dane mapy © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> 
  &nbsp;•&nbsp; Podkład © <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>
</p>
      </div>
    </div>
  );
}

/* ===== helpers mapowania ===== */
function mapApiHits(raw: ApiHit[]): Hit[] {
  const seen = new Set<string>(); const out: Hit[] = [];
  for (const r of raw) {
    const name = String(r.name ?? r.city ?? '').trim(); if (!name) continue;
    const region = String(r.region ?? r.voivodeship ?? '').trim();
    const id = String(r.id ?? `${name}|${region}|${r.county ?? ''}`);
    const key = `${name.toLowerCase()}|${region.toLowerCase()}`;
    if (seen.has(key)) continue; seen.add(key);
    out.push({
      id, name, region, county: r.county, type: r.type ?? r.simc_type,
      lat: r.lat as any, lon: r.lon as any,
    });
  }
  return out;
}
function mapNominatim(data: any[]): Hit[] {
  return (Array.isArray(data) ? data : []).map((it: any, idx: number) => {
    const name = it.address?.city || it.address?.town || it.address?.village || '';
    const region = it.address?.state || '';
    return {
      id: `${name}|${region}|${it.osm_id ?? idx}`,
      name,
      region,
      type: it.type,
      lat: parseFloat(it.lat),
      lon: parseFloat(it.lon),
    };
  });
}
