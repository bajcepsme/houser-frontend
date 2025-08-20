'use client';

import { useEffect } from 'react';
import {
  loadBrandFromLocalStorage,
  saveBrandToLocalStorage,
  applyBrandToHtml,
  deepMerge,
  notifyBrandUpdated,
  normalizeBrand,
  type BrandPayload,
} from '@/lib/brand';

/**
 * BrandMetadataClient – pobiera brand z publicznego API i MERGE-uje z tym,
 * co jest w localStorage. W ten sposób nie kasujemy listing_card.*
 * jeśli endpoint zwraca tylko wycinek brandu.
 *
 * Uwaga: brak odwołań do window/document poza useEffect → brak ryzyka hydration.
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '').replace(/\/+$/, '');

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function pickPatchFromApi(data: any): Partial<BrandPayload> {
  if (!isObject(data)) return {};

  // Klucze, które publiczny endpoint może zwracać "częściowo".
  // Jeżeli pewnego klucza nie ma – NIE nadpisujemy go undefined/null.
  const allowedTopLevel: (keyof BrandPayload)[] = [
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

  for (const key of allowedTopLevel) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const val = data[key as keyof typeof data];
      if (val !== undefined && val !== null) {
        (patch as any)[key] = val;
      }
    }
  }

  // Jeśli API już zwraca pełną lub częściową gałąź listing_card – dołączamy ją.
  if (isObject((data as any).listing_card)) {
    patch.listing_card = (data as any).listing_card as BrandPayload['listing_card'];
  }

  return patch;
}

export default function BrandMetadataClient() {
  useEffect(() => {
    // 1) Podstawa z localStorage (nic nie aplikujemy tutaj – robi to BrandBootstrap).
    const baseLs = (loadBrandFromLocalStorage() as BrandPayload | null) || null;

    // 2) Opcjonalny fetch publicznego brandu i MERGE jako patch
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

        const apiData = await res.json();

        // Zbuduj patch ograniczony do bezpiecznych kluczy (lub pełny brand, jeśli dostępny)
        const patch = pickPatchFromApi(apiData);

        // Jeśli API nic użytecznego nie zwraca – nic nie rób
        if (!Object.keys(patch).length) return;

        // MERGE: LS -> +patch z API (NIE zastępujemy listing_card, jeśli API go nie podało)
        const base = normalizeBrand(baseLs || {});
        const next = normalizeBrand(deepMerge(base, patch));

        // Jeżeli nic się realnie nie zmieniło – wyjdź
        const before = JSON.stringify(base);
        const after = JSON.stringify(next);
        if (before === after) return;

        // Zapisz, zastosuj, powiadom
        saveBrandToLocalStorage(next);
        applyBrandToHtml(next);
        notifyBrandUpdated();
      } catch {
        // ciche pominięcie błędów sieci
      }
    })();

    return () => controller.abort();
  }, []);

  return null;
}
