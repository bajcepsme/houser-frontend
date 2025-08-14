'use client';

import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

type City = {
  id: string | number;
  name: string;                 // nazwa miejscowości
  region?: string;              // województwo (może przyjść pod różnymi kluczami z API)
  voivodeship?: string;
  wojewodztwo?: string;
  province?: string;
};

type GeoAutocompleteProps = {
  value: string;
  onChange: (val: string) => void;
  onPick?: (city: { name: string; region: string }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
};

const DEBOUNCE_MS = 220;

export default function GeoAutocomplete({
  value,
  onChange,
  onPick,
  placeholder = 'Wpisz miasto…',
  className = '',
  disabled,
  autoFocus,
}: GeoAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<City[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const debTimer = useRef<any>(null);

  // ujednolicenie pola województwa z API
  const getRegion = (c: City) =>
    c.region ?? c.voivodeship ?? (c as any).voivodship ?? c.wojewodztwo ?? c.province ?? '';

  // pobieranie z debounce
  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setItems([]);
      setOpen(false);
      setActiveIdx(-1);
      return;
    }

    setLoading(true);
    if (debTimer.current) clearTimeout(debTimer.current);

    debTimer.current = setTimeout(async () => {
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();

      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/geo/search?q=${encodeURIComponent(
          value.trim()
        )}&limit=8`;
        const res = await fetch(url, { signal: controllerRef.current.signal, cache: 'no-store' });
        const data = await res.json();
        const arr: City[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        setItems(arr);
        setOpen(true);
        setActiveIdx(arr.length > 0 ? 0 : -1);
      } catch {
        // ignorujemy abort/errorek
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(debTimer.current);
  }, [value]);

  // obsługa klawiatury
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % Math.max(items.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && items[activeIdx]) {
        pick(items[activeIdx]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const pick = (c: City) => {
    const region = getRegion(c);
    onChange(c.name);
    onPick?.({ name: c.name, region });
    setOpen(false);
    setActiveIdx(-1);
  };

  // zamykanie po kliknięciu poza dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        !listRef.current?.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {/* map-pin */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 22s7-5.33 7-12a7 7 0 10-14 0c0 6.67 7 12 7 12z" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.trim().length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="input-modern pl-10"
          type="text"
        />
      </div>

      {/* dropdown */}
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200/70 bg-white/95 shadow-xl backdrop-blur-sm"
        >
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500">Szukam miejscowości…</div>
          )}
          {!loading && items.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">Brak dopasowań.</div>
          )}
          <ul role="listbox">
            {items.map((c, idx) => {
              const region = getRegion(c);
              const active = idx === activeIdx;
              return (
                <li
                  key={`${c.id}-${idx}`}
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(c)}
                  className={[
                    'cursor-pointer px-4 py-3 transition-colors',
                    active ? 'bg-gray-50' : 'bg-transparent',
                    'hover:bg-gray-50'
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-gray-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M12 22s7-5.33 7-12a7 7 0 10-14 0c0 6.67 7 12 7 12z" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 leading-5">{c.name}</div>
                      {region ? (
                        <div className="text-sm text-gray-500 leading-5">{region}</div>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
