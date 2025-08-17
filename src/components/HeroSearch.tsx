"use client";
import SearchBar from "@/components/SearchBar";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Option = { value: string; label: string };

const KINDS: Option[] = [
  { value: "", label: "Wszystkie" },
  { value: "mieszkania", label: "Mieszkania" },
  { value: "domy", label: "Domy" },
  { value: "dzialki", label: "Działki" },
  { value: "garaze", label: "Garaże" },
  { value: "lokale", label: "Lokale usługowe" },
  { value: "hale", label: "Hale i magazyny" },
  { value: "hotele", label: "Hotele i pensjonaty" },
  { value: "palace", label: "Pałace i zamki" },
];

const TYPES: Option[] = [
  { value: "sprzedaz", label: "Na sprzedaż" },
  { value: "wynajem", label: "Do wynajęcia" },
  { value: "dzierzawa", label: "Dzierżawa" },
];

const FALLBACK_CITIES = [
  "Warszawa","Kraków","Łódź","Wrocław","Poznań","Gdańsk","Szczecin","Białystok","Rzeszów","Katowice",
];

/* ---------- helpers ---------- */

function useOutsideClick<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);
  return ref;
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return text;
  const before = text.slice(0, i);
  const hit = text.slice(i, i + query.length);
  const after = text.slice(i + query.length);
  return (
    <>
      {before}
      <b>{hit}</b>
      {after}
    </>
  );
}

function CustomSelect({
  options, placeholder, value, onChange, prefix,
  closeAll, onOpen,
}: {
  options: Option[];
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  closeAll: () => void;
  onOpen: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const current = options.find(o => o.value === value) ?? options[0];
  const ref = useOutsideClick<HTMLDivElement>(() => setOpened(false));

  return (
    <div className="relative w-full">
      {prefix && <span className="search-label">{prefix}</span>}
      <div ref={ref} className="custom-select-wrapper">
        <div
          className={`custom-select ${opened ? "opened" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!opened) { closeAll(); onOpen(); }
            setOpened(v => !v);
          }}
        >
          <span className="custom-select-trigger">{current?.label ?? placeholder}</span>
          <div className="custom-options">
            {options.map(opt => (
              <span
                key={opt.value}
                className={`custom-option ${opt.value === value ? "selection" : ""}`}
                data-value={opt.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.value);
                  setOpened(false);
                }}
              >
                {opt.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- main ---------- */

export default function HeroSearch() {
  const router = useRouter();
  const [kind, setKind] = useState(KINDS[0].value);
  const [typ, setTyp] = useState(TYPES[0].value);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggest, setSuggest] = useState<string[]>([]);
  const [anySelectOpen, setAnySelectOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // global: klik poza dowolny element zamyka selecty i sugestie
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (boxRef.current && !boxRef.current.contains(target)) setSuggest([]);
      if (!(target as HTMLElement).closest(".custom-select-wrapper")) setAnySelectOpen(false);
      // wymuszamy zamknięcie przez zmianę klasy wszystkich selectów
      document.querySelectorAll(".custom-select.opened").forEach(el => el.classList.remove("opened"));
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // podpowiedzi lokalizacji (API + fallback)
  useEffect(() => {
    const v = q.trim();
    if (!v) { setSuggest([]); return; }

    const ctrl = new AbortController();
    const base = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://127.0.0.1:8000").replace(/\/+$/,"");
    const url = `${base}/api/v1/locations?suggest=${encodeURIComponent(v)}`;

    const t = setTimeout(async () => {
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (res.ok) {
          const pay = await res.json();
          const items = Array.isArray(pay?.data) ? pay.data : Array.isArray(pay) ? pay : [];
          const names = items.map((it: any) => it?.name || it?.city || it?.label).filter(Boolean);
          setSuggest((names.length ? names : FALLBACK_CITIES.filter(c => c.toLowerCase().includes(v.toLowerCase()))).slice(0, 8));
        } else {
          setSuggest(FALLBACK_CITIES.filter(c => c.toLowerCase().includes(v.toLowerCase())).slice(0, 8));
        }
      } catch {
        setSuggest(FALLBACK_CITIES.filter(c => c.toLowerCase().includes(v.toLowerCase())).slice(0, 8));
      }
    }, 180);

    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  function doSearch() {
    const params = new URLSearchParams();
    if (kind) params.set("rodzaj", kind);
    if (typ) params.set("typ", typ);
    if (q.trim()) params.set("q", q.trim());
    setLoading(true);
    router.push(`/ogloszenia?${params.toString()}`);
  }

  // zamknij wszystkie selecty – przekazywane do dzieci
  const closeAllSelects = () => {
    document.querySelectorAll(".custom-select.opened").forEach(el => el.classList.remove("opened"));
    setAnySelectOpen(false);
  };

  return (
    <div className="search-card">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.2fr_auto] gap-2 md:gap-3 items-center">
        <div className="relative">
          <span className="search-label">Rodzaj nieruchomości</span>
          <CustomSelect
            options={KINDS}
            value={kind}
            onChange={setKind}
            placeholder="Wszystkie"
            closeAll={closeAllSelects}
            onOpen={() => setAnySelectOpen(true)}
          />
        </div>

        <div className="relative">
          <span className="search-label">Typ oferty</span>
          <CustomSelect
            options={TYPES}
            value={typ}
            onChange={setTyp}
            placeholder="Na sprzedaż"
            closeAll={closeAllSelects}
            onOpen={() => setAnySelectOpen(true)}
          />
        </div>

        <div className="relative" ref={boxRef}>
          <span className="search-label">Lokalizacja</span>
          <div className="filter locate h-[55px] border border-gray-200 rounded-[4px]">
            <i className="fa fa-map-marker" aria-hidden="true" />
            <input
              className="w-full h-full pl-11 pr-4 bg-transparent outline-none text-[15px] font-semibold text-[var(--font)]"
              placeholder="Wpisz miasto lub województwo"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => q && setSuggest(prev => prev.length ? prev : FALLBACK_CITIES.slice(0,6))}
              onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
            />
          </div>

          {suggest.length > 0 && (
            <ul className="loc-list">
              {suggest.map((s, idx) => (
                <li
                  key={`${s}-${idx}`}
                  className="loc-item"
                  onClick={() => { setQ(s); setSuggest([]); }}
                >
                  <i className="fa fa-map-marker" aria-hidden="true" />
                  <span>{highlightMatch(s, q)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          className={`search-btn ${loading ? "loading" : ""}`}
          onClick={doSearch}
          disabled={loading}
          aria-busy={loading}
          aria-label="Szukaj"
        >
          <span className="label">Szukaj</span>
          <i className="fa fa-search" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
