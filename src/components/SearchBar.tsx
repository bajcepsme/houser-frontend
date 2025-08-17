"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";

/* ======================= Types ======================= */

type ApiHit = {
  id?: string | number;
  city?: string;
  name?: string;
  voivodeship?: string; // województwo
  region?: string;      // alternatywna nazwa województwa
  county?: string;
  simc_type?: string;
  type?: string;
};

type Hit = {
  id: string;
  name: string;         // miasto/miejscowość
  region?: string;      // województwo
  county?: string;
  type?: string;
};

type Props = {
  initialCity?: string;
  onPick?: (payload: { name: string; region?: string }) => void;
  className?: string;
  minChars?: number;
  preventFreeEnterNav?: boolean;
};

/* ======================= Helpers ======================= */

function apiBase() {
  return (
    (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://127.0.0.1:8000")
      .toString()
      .replace(/\/+$/, "")
  );
}

/* ======================= Component ======================= */

export default function SearchBar({
  initialCity = "",
  onPick,
  className = "",
  minChars = 1,
  preventFreeEnterNav = false,
}: Props) {
  const router = useRouter();

  const [value, setValue] = useState<string>(String(initialCity ?? ""));
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rawHits, setRawHits] = useState<Hit[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const abortRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // aktualizacja value, jeśli initialCity zmieni się z zewnątrz
  useEffect(() => {
    setValue(String(initialCity ?? ""));
  }, [initialCity]);

  // zamykanie po kliknięciu poza / ESC
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // fetch z debounce + mapowanie pól z API → Hit
  useEffect(() => {
    const q = (value ?? "").trim();
    if (q.length < minChars) {
      setRawHits([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const url = `${apiBase()}/api/v1/geo/search?q=${encodeURIComponent(q)}&limit=20`;

    const t = setTimeout(async () => {
      try {
        const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();

        // różne kształty odpowiedzi → weź tablicę rekordów
        const raw: ApiHit[] = Array.isArray(payload?.hits)
          ? payload.hits
          : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : [];

        // mapowanie do kanonicznego kształtu + dedup po (name|region)
        const seen = new Set<string>();
        const mapped: Hit[] = raw
          .map((r: ApiHit): Hit | null => {
            const name = String(r.name ?? r.city ?? "").trim();
            const region = String(r.region ?? r.voivodeship ?? "").trim();
            if (!name) return null;
            const id = String(r.id ?? `${name}|${region}|${r.county ?? ""}`) || name;
            return {
              id,
              name,
              region,
              county: r.county,
              type: r.type ?? r.simc_type,
            };
          })
          .filter(Boolean)
          .filter((h: Hit) => {
            const key = `${String(h.name).toLowerCase()}|${String(
              (h as any).region ?? (h as any).voivodeship ?? ""
            ).toLowerCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }) as Hit[];

        setRawHits(mapped);
        setOpen(true);
        setActiveIndex(-1);
      } catch {
        setRawHits([]);
        setOpen(true);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 180); // lekki debounce

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value, minChars]);

  // ranking (przód listy: exact match, prefix, miasta)
  const hits = useMemo(() => {
    // 1) tylko jednostki miejskie (jeśli backend podaje "type")
    const allowed = [
      "miasto",
      "miasto na prawach powiatu",
      "część miasta",
      "dzielnica",
      "osiedle",
    ];

    const onlyCities = (rawHits ?? []).filter((h) => {
      const okName = typeof h?.name === "string" && h.name.trim().length > 0;
      if (!okName) return false;
      const t = String((h as any).type ?? "").toLowerCase();
      // gdy typ jest znany — wymagamy, by był „miejski”; gdy brak typu — nie odrzucamy
      return !t || allowed.some((a) => t.includes(a));
    });

    // 2) scoring
    const score = (h: Hit) => {
      const name = String(h.name ?? (h as any).city ?? "").toLocaleLowerCase("pl-PL");
      const voiv = String(
        (h as any).region ?? (h as any).voivodeship ?? ""
      ).toLocaleLowerCase("pl-PL");
      const county = String((h as any).county ?? "").toLocaleLowerCase("pl-PL");
      const q = (value ?? "").trim().toLocaleLowerCase("pl-PL");

      let s = 0;
      if (q && name === q) s += 100;
      if (q && name.startsWith(q)) s += 40;

      const t = String((h as any).type ?? "").toLowerCase();
      if (t.includes("miasto")) s += 50;

      if (county === name || county.includes("m.") || county.includes("miasto")) s += 40;

      const capitals: Record<string, string> = {
        warszawa: "mazowieckie",
        kraków: "małopolskie",
        wrocław: "dolnośląskie",
        poznań: "wielkopolskie",
        gdańsk: "pomorskie",
        szczecin: "zachodniopomorskie",
        olsztyn: "warmińsko-mazurskie",
        białystok: "podlaskie",
        rzeszów: "podkarpackie",
        lublin: "lubelskie",
        kielce: "świętokrzyskie",
        katowice: "śląskie",
        opole: "opolskie",
        łódź: "łódzkie",
        bydgoszcz: "kujawsko-pomorskie",
        toruń: "kujawsko-pomorskie",
        "zielona góra": "lubuskie",
        "gorzów wielkopolski": "lubuskie",
      };
      if (capitals[name] && capitals[name] === voiv) s += 80;

      return s;
    };

    // 3) deduplikacja po nazwie (zostaw jeden najlepszy)
    const bestByName = new Map<string, { hit: Hit; s: number }>();
    for (const h of onlyCities) {
      const key = String(h.name ?? (h as any).city ?? "").toLocaleLowerCase("pl-PL");
      const s = score(h);
      const prev = bestByName.get(key);
      if (!prev || s > prev.s) bestByName.set(key, { hit: h, s });
    }
    const list = Array.from(bestByName.values()).map((x) => x.hit);

    // 4) sort i limit
    return list.sort((a, b) => score(b) - score(a)).slice(0, 10);
  }, [rawHits, value]);

  const pick = (h: Hit) => {
    setValue(h.name);
    setOpen(false);
    if (onPick) {
      onPick({ name: h.name, region: h.region });
    } else {
      const params = new URLSearchParams();
      // główny parametr jaki czyta Twoja strona wyników:
      params.set("lokalizacja", h.name);
      // dla kompatybilności z wcześniejszym routingiem:
      params.set("city", h.name);
      router.push(`/ogloszenia?${params.toString()}`);
    }
  };

  // bezpieczne podświetlenie dopasowania
  const Highlight = ({ text }: { text?: string }) => {
    const base = String(text ?? "");
    const q = (value ?? "").trim();
    if (!q) return <>{base}</>;
    const baseL = base.toLocaleLowerCase("pl-PL");
    const qL = q.toLocaleLowerCase("pl-PL");
    const idx = baseL.indexOf(qL);
    if (idx < 0) return <>{base}</>;
    return (
      <>
        {base.slice(0, idx)}
        <span className="font-semibold">{base.slice(idx, idx + q.length)}</span>
        {base.slice(idx + q.length)}
      </>
    );
  };

  // nawigacja klawiszami
  const onKeyDownInput: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open || (!loading && hits.length === 0)) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min((i < 0 ? -1 : i) + 1, hits.length - 1));
      listRef.current
        ?.querySelectorAll<HTMLButtonElement>("button")
        [Math.min(activeIndex + 1, hits.length - 1)]
        ?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max((i < 0 ? hits.length : i) - 1, 0));
      listRef.current
        ?.querySelectorAll<HTMLButtonElement>("button")
        [Math.max(activeIndex - 1, 0)]
        ?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < hits.length) {
        e.preventDefault();
        pick(hits[activeIndex]);
      } else if (!onPick && !preventFreeEnterNav && value.trim()) {
        e.preventDefault();
        const name = value.trim();
        const params = new URLSearchParams();
        params.set("lokalizacja", name);
        params.set("city", name);
        router.push(`/ogloszenia?${params.toString()}`);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <div className="flex gap-2">
        <input
          className="input-modern flex-1"
          placeholder="Wpisz miasto…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => (rawHits.length || loading) && setOpen(true)}
          onKeyDown={onKeyDownInput}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="city-suggest-list"
        />

        {/* Uwaga: type='button' żeby nie wywoływać submitu z nadrzędnego <form> */}
        <button
          className="btn-primary px-4"
          type="button"
          onClick={() => {
            const name = value.trim();
            if (!onPick && !preventFreeEnterNav && name) {
              const params = new URLSearchParams();
              params.set("lokalizacja", name);
              params.set("city", name);
              router.push(`/ogloszenia?${params.toString()}`);
            }
          }}
        >
          Szukaj
        </button>
      </div>

      {open && (hits.length > 0 || loading) && (
        <div
          id="city-suggest-list"
          ref={listRef}
          className="dropdown-panel mt-2 z-[60] w-full max-h-72 overflow-auto"
          onMouseDown={(e) => e.preventDefault()}
          role="listbox"
        >
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Szukam…</div>
          )}

          {!loading &&
            hits.map((h, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => pick(h)}
                  className={`w-full text-left px-3 py-2.5 transition-colors flex items-start gap-3 ${
                    isActive ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                  role="option"
                  aria-selected={isActive}
                >
                  <MapPin className="mt-[2px] shrink-0" size={18} />
                  <div className="min-w-0">
                    <div className="leading-tight">
                      <Highlight text={h.name} />
                    </div>
                    {h.region && (
                      <div className="text-[13px] text-gray-500">
                        {h.region}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

          {!loading && hits.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              Brak wyników dla „{value}”.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
