"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import ListingCard from "@/components/ListingCard"; 
import FilterBar, { OfferType } from "./components/FilterBar";

// 🚀 tylko tu robimy dynamiczny import MapView
const MapView = dynamic(() => import("./components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-[60vh] w-full rounded-2xl bg-gray-100 animate-pulse" />
  ),
});

type ApiImage = { url?: string | null; type?: string | null };
type ApiListing = {
  id: number;
  title: string;
  price: number;   // grosze
  area: number;
  address_city: string;
  address_region: string;
  lat: number | null;
  lng: number | null;
  category?: string | null;
  offer_type?: OfferType | null;
  images?: ApiImage[];
};

const toThumb = (imgs?: ApiImage[]) => (Array.isArray(imgs) && imgs[0]?.url) || "";

export default function ResultsClient({ initialData }: { initialData: ApiListing[] }) {
  const [data, setData] = React.useState<ApiListing[]>(initialData || []);
  const [loading, setLoading] = React.useState(false);

  // hover sync (karta ↔ marker)
  const [activeId, setActiveId] = React.useState<number | null>(null);

  // --- FILTRY ---
  const [city, setCity] = React.useState<string>("");
  const [query, setQuery] = React.useState<string>("");
  const [category, setCategory] = React.useState<string>("");
  const [type, setType] = React.useState<OfferType | "">("");
  const [priceFrom, setPriceFrom] = React.useState<string>("");
  const [priceTo, setPriceTo] = React.useState<string>("");

  // debounce
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedFetch = React.useCallback((fn: () => void) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fn, 350);
  }, []);

  const fetchResults = React.useCallback(async () => {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
    const qs = new URLSearchParams();
    qs.set("per_page", "60");
    qs.set("include", "images");
    if (city) qs.set("city", city);
    if (query) qs.set("q", query);
    if (category) qs.set("category", category);
    if (type) qs.set("type", type);
    if (priceFrom) qs.set("price_from", priceFrom);
    if (priceTo) qs.set("price_to", priceTo);

    setLoading(true);
    try {
      const res = await fetch(`${base}/api/v1/listings?${qs.toString()}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      const arr = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      setData(arr);
    } finally {
      setLoading(false);
    }
  }, [city, query, category, type, priceFrom, priceTo]);

  React.useEffect(() => {
    debouncedFetch(fetchResults);
  }, [city, query, category, type, priceFrom, priceTo, debouncedFetch, fetchResults]);

  return (
    <div className="w-full grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_430px] gap-4 lg:gap-6">
      {/* Mapa z pływającym polem miasta */}
      <div className="min-h-[60vh]">
        <MapView
          listings={data}
          onPickCity={(c) => setCity(c)}
          cityValue={city}
          padding={{ top: 16, left: 16 }}
          activeId={activeId}
          onHover={setActiveId}
        />
      </div>

      {/* Prawy panel: filtry i lista */}
      <aside className="rounded-2xl bg-white border border-gray-200/70 shadow-sm p-3 sm:p-4 lg:p-5 sticky top-4 h-fit max-h-[calc(100vh-32px)] overflow-auto">
        <div className="sticky top-0 z-10 bg-white pb-3">
          <FilterBar
            values={{ city, query, category, type, priceFrom, priceTo }}
            onChange={(v) => {
              if (v.city !== undefined) setCity(v.city);
              if (v.query !== undefined) setQuery(v.query);
              if (v.category !== undefined) setCategory(v.category);
              if (v.type !== undefined) setType(v.type);
              if (v.priceFrom !== undefined) setPriceFrom(v.priceFrom);
              if (v.priceTo !== undefined) setPriceTo(v.priceTo);
            }}
            onReset={() => {
              setQuery("");
              setCategory("");
              setType("");
              setPriceFrom("");
              setPriceTo("");
            }}
          />
          <div className="mt-3 text-xs text-gray-500">
            {loading ? "Wczytywanie…" : `Znaleziono ${data?.length ?? 0} ofert`}
          </div>
        </div>

        <ul className="mt-3 space-y-3">
          {data.map((it) => (
            <li key={it.id}>
              <ListingCard
                id={it.id}
                title={it.title}
                price={it.price}
                area={it.area}
                city={it.address_city}
                region={it.address_region}
                thumb={toThumb(it.images)}
                images={it.images}
                offerType={it.offer_type || undefined}
                onHover={(v) => setActiveId(v)}
              />
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
