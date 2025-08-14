"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { softPinIcon, ensureSoftMarkerCss } from "@/lib/softMarker";

type OfferType = "sprzedaz" | "wynajem" | "dzierzawa";
type ApiListing = {
  id: number; title: string; price: number; area: number;
  lat: number | null; lng: number | null;
  address_city: string; address_region: string;
  offer_type?: OfferType | null;
};

type Props = {
  listings: ApiListing[];
  onPickCity: (city: string) => void;
  cityValue: string;
  padding?: { top?: number; left?: number };
  activeId?: number | null;
  onHover?: (id: number | null) => void;
};

function useCitySearch() {
  const [items, setItems] = React.useState<Array<{ city: string; voivodeship?: string; county?: string }>>([]);
  const [loading, setLoading] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  const search = React.useCallback(async (q: string) => {
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController(); abortRef.current = ac;
    if (!q || q.length < 2) { setItems([]); return; }
    setLoading(true);
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
      const res = await fetch(`${base}/api/v1/geo/search?q=${encodeURIComponent(q)}`, { signal: ac.signal });
      const json = await res.json().catch(() => []);
      const arr: any[] = Array.isArray(json) ? json : (json?.data ?? []);
      const uniq = new Map<string, { city: string; voivodeship?: string; county?: string }>();
      arr.forEach((x) => {
        const key = `${x.city}|${x.voivodeship ?? ""}|${x.county ?? ""}`;
        if (!uniq.has(key)) uniq.set(key, { city: x.city, voivodeship: x.voivodeship, county: x.county });
      });
      setItems(Array.from(uniq.values()).slice(0, 8));
    } finally { setLoading(false); }
  }, []);

  return { items, loading, search, setItems };
}

export default function MapView({
  listings, onPickCity, cityValue, padding, activeId, onHover,
}: Props) {
  const [center] = React.useState<[number, number]>([52.2297, 21.0122]);
  const [zoom] = React.useState<number>(12);

  const [cityInput, setCityInput] = React.useState(cityValue || "");
  const { items, loading, search, setItems } = useCitySearch();

  React.useEffect(() => { setCityInput(cityValue || ""); }, [cityValue]);
  React.useEffect(() => { const t = setTimeout(() => search(cityInput), 250); return () => clearTimeout(t); }, [cityInput, search]);

  React.useEffect(() => { ensureSoftMarkerCss(); }, []);

  return (
    <div className="relative w-full">
      {/* ... (Twój panel wyszukiwania miasta bez zmian) ... */}

      <MapContainer
        center={center}
        zoom={zoom}
        className="h-[78vh] w-full rounded-2xl overflow-hidden"
        scrollWheelZoom
        attributionControl={false}   // ← ukrywa „Leaflet | © OSM”
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {listings.filter(x => x.lat!=null && x.lng!=null).map((l) => {
          const isActive = l.id === activeId;
          return (
            <Marker
              key={`marker-${l.id}`}
              position={[l.lat!, l.lng!]}
              icon={softPinIcon({ color: isActive ? "#2563EB" : "#FF8A65", active: isActive })}
              zIndexOffset={isActive ? 1000 : 0}
              eventHandlers={{ mouseover: () => onHover?.(l.id), mouseout: () => onHover?.(null) }}
            >
              <Popup>
                <div className="text-sm font-medium">{l.title}</div>
                <div className="text-xs text-gray-600">{l.address_city}, {l.address_region}</div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
