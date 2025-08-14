'use client';

import React, { useEffect, useRef, useState } from 'react';
import L, { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Pin = {
  id: number | string;
  title: string;
  price?: number;
  lat: number;
  lng: number;
  imageUrl?: string;
  address_city?: string;
};

type Props = {
  items: Pin[];
  height?: number;
};

export default function UserListingsMap({ items, height = 420 }: Props) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null); // trzymamy instancję mapy
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 1) Inicjalizacja mapy (raz) + higiena StrictMode
  useEffect(() => {
    const el = shellRef.current;
    if (!mounted || !el) return;

    // jeśli Leaflet zdążył się już przypiąć do tego diva (StrictMode/HMR),
    // usuń ślady i wyczyść wnętrze, zanim zainicjalizujemy nową mapę
    // @ts-ignore
    if ((el as any)._leaflet_id) {
      el.innerHTML = '';
      // @ts-ignore
      delete (el as any)._leaflet_id;
    }

    if (!mapRef.current) {
      mapRef.current = L.map(el, {
        center: [52.237049, 21.017532],
        zoom: 6,
        zoomControl: false,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors & CARTO',
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
      setTimeout(() => mapRef.current?.invalidateSize(), 200);
    }

    // sprzątanie na unmount: usuń mapę z DOM (ważne w dev/StrictMode)
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mounted]);

  // 2) Render pinów (każda zmiana items => odśwież warstwę)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // osobna warstwa na markery, żeby łatwo czyścić
    const layer = L.layerGroup().addTo(map);

    const pinIcon = L.divIcon({
      className: 'soft-pin',
      html: `
        <span class="ring"></span>
        <svg viewBox="0 0 48 64" class="pin-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M24 2C13.4 2 4.8 10.6 4.8 21.2C4.8 34.9 24 62 24 62C24 62 43.2 34.9 43.2 21.2C43.2 10.6 34.6 2 24 2Z" fill="#FF8A00"/>
          <circle cx="24" cy="22" r="8.5" fill="#ffffff"/>
        </svg>
        <span class="shadow"></span>`,
      iconSize: [44, 60],
      iconAnchor: [22, 58],
    });

    const bounds: L.LatLngExpression[] = [];

    items.forEach((p) => {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return;
      const m = L.marker([p.lat, p.lng], { icon: pinIcon }).addTo(layer);
      const title = p.title || 'Ogłoszenie';
      const price =
        typeof p.price === 'number' ? `${(p.price / 100).toLocaleString('pl-PL')} PLN` : '';
      const place = p.address_city ? `<div class="text-xs text-gray-600">${p.address_city}</div>` : '';
      m.bindPopup(
        `<div style="font: 12px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial;">
           <div style="font-weight:600;margin-bottom:2px">${title}</div>
           ${price ? `<div style="color:#2563eb;font-weight:700">${price}</div>` : ''}
           ${place}
         </div>`
      );
      bounds.push([p.lat, p.lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds as any, { padding: [30, 30], maxZoom: 13 });
    }

    // sprzątanie warstwy przy rerenderze
    return () => {
      layer.clearLayers();
      map.removeLayer(layer);
    };
  }, [items]);

  // 3) Jednorazowy CSS dla markera (jak w LocationPickerInner)
  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById('soft-pin-css')) return;
    const el = document.createElement('style');
    el.id = 'soft-pin-css';
    el.textContent = `
      .leaflet-container { background:#f1f5f9; }
      .soft-pin{position:relative;width:44px;height:60px;pointer-events:none;}
      .soft-pin .pin-svg{display:block;width:40px;height:56px;margin:0 auto;transform-origin:50% 90%;animation:pinBob 1.5s ease-in-out infinite;}
      .soft-pin .shadow{position:absolute;left:50%;bottom:4px;width:36px;height:12px;background:radial-gradient(ellipse at center, rgba(15,23,42,.22) 0%, rgba(15,23,42,0) 70%);}
      .soft-pin .ring{position:absolute;left:50%;top:38px;width:18px;height:18px;border-radius:50%;background:#ff8a00c2;transform:translate(-50%,-50%) scale(.6);animation:ringPulse 1.5s ease-out infinite;}
      @keyframes pinBob{0%{transform:translateY(0)}50%{transform:translateY(-4px)}100%{transform:translateY(0)}}
      @keyframes ringPulse{0%{opacity:.55;transform:translate(-50%,-50%) scale(.6)}70%{opacity:0;transform:translate(-50%,-50%) scale(2.2)}100%{opacity:0;transform:translate(-50%,-50%) scale(2.2)}}
      .leaflet-control-zoom{margin:0 8px 8px 0;}
      .leaflet-control-zoom a{border-radius:12px !important; box-shadow:0 2px 6px rgba(15,23,42,.08); border:1px solid rgba(148,163,184,.35); width:36px; height:36px; line-height:34px; color:#0f172a; background:#fff;}
      .leaflet-control-zoom a:hover{background:#f8fafc;}
    `;
    document.head.appendChild(el);
  }, []);

  return (
    <div
      ref={shellRef}
      style={{ height }}
      className="w-full rounded-2xl overflow-hidden ring-1 ring-gray-200/70 shadow-sm"
    />
  );
}
