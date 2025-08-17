'use client';

import * as React from 'react';
import {
  applyBrandToHtml,
  loadBrandFromLocalStorage,
  DEFAULT_BRAND,
  normalizeBrand,
  deepMerge,
  BRAND_STORAGE_KEY,
} from '@/lib/brand';

/**
 * Nakłada zmienne brandu i dba o to, by globalne tło/kolor tekstu
 * na <body> miały najwyższy priorytet (important).
 */
export default function BrandBootstrap() {
  React.useEffect(() => {
    const apply = () => {
      const saved = loadBrandFromLocalStorage() || DEFAULT_BRAND;
      // ensure: zawsze pełny i spójny payload
      const payload = normalizeBrand(deepMerge(DEFAULT_BRAND, saved));
      applyBrandToHtml(payload);
    };

    apply(); // start
    // reaguj na zapis z panelu (własne zdarzenie) i na zmianę localStorage (druga karta)
    const onUpdated = () => apply();
    const onStorage = (e: StorageEvent) => {
      if (e.key === BRAND_STORAGE_KEY) apply();
    };
    window.addEventListener('houser:brand:updated', onUpdated as any);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('houser:brand:updated', onUpdated as any);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return null;
}

function safeApply(brand: any) {
  try {
    // Ustaw wszystkie CSS variables na :root
    applyBrandToHtml(brand);
  } catch {
    /* no-op */
  }

  // Twarde wymuszenie tła/tekstu na body – bez zależności od kolejności CSS
  try {
    const STYLE_ID = 'houser-brand-runtime';
    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }
    // Ważne: !important, żeby wygrać ze stylem globalnym / frameworkiem
    styleEl.textContent = `
      body {
        background: var(--brand-page-bg, #f8fafc) !important;
        color: var(--brand-text, #111827);
      }
    `;
  } catch {
    /* no-op */
  }
}
