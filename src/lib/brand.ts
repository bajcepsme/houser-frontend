// src/lib/brand.ts
export type BrandSettings = {
  primary?: string;
  secondary?: string;
  background?: string;
  logo_url?: string | null;
};

const CSS_VAR_MAP: Record<keyof BrandSettings, string> = {
  primary: '--brand-primary',
  secondary: '--brand-secondary',
  background: '--brand-bg',
  logo_url: '--brand-logo-url', // nie stylujemy bezpośrednio, ale zostawiamy dla ewentualnych zastosowań
};

export function applyBrandToHtml(brand: BrandSettings) {
  const root = document.documentElement;
  (Object.keys(CSS_VAR_MAP) as (keyof BrandSettings)[]).forEach((k) => {
    const cssVar = CSS_VAR_MAP[k];
    const val = brand[k];
    if (val == null || val === '') {
      root.style.removeProperty(cssVar);
    } else {
      root.style.setProperty(cssVar, String(val));
    }
  });
}

export const BRAND_LOCALSTORAGE_KEY = 'houser.brand';

export function saveBrandToLocalStorage(brand: BrandSettings) {
  try {
    localStorage.setItem(BRAND_LOCALSTORAGE_KEY, JSON.stringify(brand));
  } catch {}
}

export function loadBrandFromLocalStorage(): BrandSettings | null {
  try {
    const raw = localStorage.getItem(BRAND_LOCALSTORAGE_KEY);
    return raw ? (JSON.parse(raw) as BrandSettings) : null;
  } catch {
    return null;
  }
}
