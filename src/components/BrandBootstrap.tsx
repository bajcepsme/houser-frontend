'use client';

import { useEffect } from 'react';
import {
  applyBrandToHtml,
  loadBrandFromLocalStorage,
  saveBrandToLocalStorage,
  BRAND_EVENT,
  deepMerge,
  normalizeBrand,
  type BrandPayload,
} from '@/lib/brand';

type PublicBrand = Partial<BrandPayload>;

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '').replace(/\/+$/, '');

/** Wymusza tło strony przez !important (zaktualizuje istniejący tag jeśli jest). */
function forcePageBgImportant(bg?: string | null) {
  const color = String(bg || '').trim();
  if (typeof document === 'undefined' || !color) return;
  const id = 'brand-page-bg-important';
  let tag = document.getElementById(id) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement('style');
    tag.id = id;
    document.head.appendChild(tag);
  }
  tag.textContent = `html,body{background:${color} !important;}`;
}

function apply(brand?: Partial<BrandPayload> | null) {
  if (!brand) return;
  try {
    applyBrandToHtml(brand);
    forcePageBgImportant((brand as any).page_bg ?? (brand as any).background);
  } catch {
    /* ignore */
  }
}

/** Bezpiecznie wyciąga „patch” z publicznego API (nie nadpisuje listing_card, jeśli API go nie zwraca). */
function pickPatchFromApi(data: any): Partial<BrandPayload> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  const allowedKeys: (keyof BrandPayload)[] = [
    'title',
    'tagline',
    'meta_description',
    'logo_url',
    'favicon_url',
    'primary_color',
    'secondary_color',
    'page_bg',
    'header_bg',
    'text_color',
    'button_radius',
  ];
  const patch: Partial<BrandPayload> = {};
  for (const k of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(data, k)) {
      const v = (data as any)[k];
      if (v !== undefined && v !== null) (patch as any)[k] = v;
    }
  }
  // Jeżeli backend zwróci listing_card – dołączamy (wtedy też będzie zmergowane).
  if (data && typeof data.listing_card === 'object') {
    patch.listing_card = data.listing_card;
  }
  return patch;
}

export default function BrandBootstrap() {
  useEffect(() => {
    // 1) Na starcie: zastosuj to, co w LS (bez sieci).
    const fromLs = (loadBrandFromLocalStorage() as BrandPayload | null) || null;
    if (fromLs) apply(fromLs);

    // 2) Następnie jednorazowy fetch publicznego brandu i *merge* do LS.
    const controller = new AbortController();
    (async () => {
      try {
        if (!API_BASE) return;
        const res = await fetch(`${API_BASE}/api/v1/settings/brand`, {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) return;

        const apiData = (await res.json()) as PublicBrand;
        const patch = pickPatchFromApi(apiData);
        if (!Object.keys(patch).length) return;

        // MERGE zamiast replace – zachowujemy listing_card z LS, jeśli API go nie zwraca.
        const base = normalizeBrand(fromLs || {});
        const next = normalizeBrand(deepMerge(base, patch));

        // Nic się nie zmieniło? – wyjdź.
        if (JSON.stringify(base) === JSON.stringify(next)) return;

        saveBrandToLocalStorage(next);
        apply(next);
        window.dispatchEvent(new Event(BRAND_EVENT));
      } catch {
        /* ignore network errors */
      }
    })();

    // 3) Subskrypcje na zmiany brandu (panel admina wysyła event)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'houser.brand') {
        const b = loadBrandFromLocalStorage() as BrandPayload | null;
        apply(b);
      }
    };
    const onCustom = () => {
      const b = loadBrandFromLocalStorage() as BrandPayload | null;
      apply(b);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(BRAND_EVENT, onCustom as EventListener);

    return () => {
      controller.abort();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(BRAND_EVENT, onCustom as EventListener);
    };
  }, []);

  return null;
}
