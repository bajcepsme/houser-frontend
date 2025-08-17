'use client';

import * as React from 'react';
import { loadBrandFromLocalStorage } from '@/lib/brand';

/**
 * BrandLoader – rozprowadza CSS variables na <html>.
 * Najważniejsza poprawka: używamy nazw, których oczekuje globals.css:
 *   --brand-primary / --brand-secondary / --brand-text
 *   --brand-bg      / --brand-header-bg
 */

const root = () => document.documentElement;
const setVar = (name: string, value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return;
  root().style.setProperty(name, String(value));
};

function applyListingVars(lc: any = {}) {
  const g = lc.grid || {};
  const l = lc.list || {};

  // GRID
  setVar('--lc-grid-bg', g.cardBg ?? g.bg ?? g.background);
  setVar('--lc-grid-radius', g.cardRadius ?? g.radius ?? 12);
  setVar('--lc-grid-shadow', g.cardShadow ?? '0 1px 1px rgba(0,0,0,.03), 0 6px 18px rgba(0,0,0,.06)');
  setVar('--lc-grid-outline', g.cardOutline ?? 'none');
  setVar('--lc-grid-content-px', g.contentPx ?? 12);
  setVar('--lc-grid-content-py', g.contentPy ?? 12);

  setVar('--lc-grid-img-aspect', g.imgAspect ?? '16 / 9');
  setVar('--lc-grid-img-hover-scale', g.imgHoverScale ?? 1.03);
  setVar('--lc-transition', g.transitionMs ?? 300);
  setVar('--lc-grid-hover-translate', g.hoverTranslate ?? '-2px');
  setVar('--lc-grid-icons-color', g.iconsColor ?? '#64748b');

  setVar('--lc-grid-title-size', g.titleSize ?? g.title?.size ?? 16);
  setVar('--lc-grid-title-weight', g.titleWeight ?? g.title?.weight ?? 600);
  setVar('--lc-grid-title-color', g.titleColor ?? g.title?.color ?? '#111827');
  setVar('--lc-grid-title-align', g.titleAlign ?? g.title?.align ?? 'left');
  setVar('--lc-grid-title-mt', g.titleMt ?? g.title?.mt ?? 0);
  setVar('--lc-grid-title-mb', g.titleMb ?? g.title?.mb ?? 6);
  setVar('--lc-grid-title-px', g.titlePx ?? g.title?.px ?? 0);
  setVar('--lc-grid-title-py', g.titlePy ?? g.title?.py ?? 0);

  setVar('--lc-grid-address-size', g.addressSize ?? 12);
  setVar('--lc-grid-address-weight', g.addressWeight ?? 400);
  setVar('--lc-grid-address-color', g.addressColor ?? '#6b7280');
  setVar('--lc-grid-address-align', g.addressAlign ?? 'left');
  setVar('--lc-grid-address-mt', g.addressMt ?? 4);
  setVar('--lc-grid-address-mb', g.addressMb ?? 0);
  setVar('--lc-grid-address-px', g.addressPx ?? 0);
  setVar('--lc-grid-address-py', g.addressPy ?? 0);

  setVar('--lc-grid-price-bg', g.priceBg ?? '#ffb800');
  setVar('--lc-grid-price-color', g.priceColor ?? '#111827');
  setVar('--lc-grid-price-size', g.priceSize ?? 14);
  setVar('--lc-grid-price-weight', g.priceWeight ?? 600);
  setVar('--lc-grid-price-justify', g.priceJustify ?? 'left');
  setVar('--lc-grid-price-mt', g.priceMt ?? 8);
  setVar('--lc-grid-price-mb', g.priceMb ?? 0);
  setVar('--lc-grid-price-px', g.pricePx ?? 8);
  setVar('--lc-grid-price-py', g.pricePy ?? 4);
  setVar('--lc-grid-price-radius', g.priceRadius ?? 8);

  setVar('--lc-grid-chip-bg', g.chipBg ?? 'rgba(0,0,0,.75)');
  setVar('--lc-grid-chip-color', g.chipColor ?? '#fff');
  setVar('--lc-grid-chip-border', g.chipBorder ?? 'none');
  setVar('--lc-grid-chip-justify', g.chipJustify ?? 'left');
  setVar('--lc-grid-chip-fs', g.chipFont ?? 11);
  setVar('--lc-grid-chip-px', g.chipPx ?? 8);
  setVar('--lc-grid-chip-py', g.chipPy ?? 2);
  setVar('--lc-grid-chip-radius', g.chipRadius ?? 999);

  setVar('--lc-grid-imgcount-bg', g.imgCounterBg ?? 'rgba(0,0,0,.55)');
  setVar('--lc-grid-imgcount-color', g.imgCounterColor ?? '#fff');

  setVar('--lc-grid-meta-bg', g.metaBg ?? g.meta?.bg ?? g.meta?.background ?? 'rgba(17,24,39,.06)');
  setVar('--lc-grid-meta-color', g.metaColor ?? g.meta?.color ?? '#111827');
  setVar('--lc-grid-meta-fs', g.metaFont ?? g.meta?.size ?? 12);
  setVar('--lc-grid-meta-weight', g.metaWeight ?? g.meta?.weight ?? 500);
  setVar('--lc-grid-meta-px', g.metaPx ?? 8);
  setVar('--lc-grid-meta-py', g.metaPy ?? 4);
  setVar('--lc-grid-meta-radius', g.metaRadius ?? 8);
  setVar('--lc-grid-meta-justify', g.metaJustify ?? 'left');
  setVar('--lc-grid-meta-mt', g.metaMt ?? 8);
  setVar('--lc-grid-meta-mb', g.metaMb ?? 0);

  // LIST
  setVar('--lc-list-bg', l.cardBg ?? l.bg ?? l.background);
  setVar('--lc-list-radius', l.cardRadius ?? l.radius ?? 12);
  setVar('--lc-list-shadow', l.cardShadow ?? '0 1px 1px rgba(0,0,0,.03), 0 6px 18px rgba(0,0,0,.06)');
  setVar('--lc-list-outline', l.cardOutline ?? 'none');
  setVar('--lc-list-content-px', l.contentPx ?? 12);
  setVar('--lc-list-content-py', l.contentPy ?? 12);

  setVar('--lc-list-img-aspect', l.imgAspect ?? '16 / 9');
  setVar('--lc-list-img-hover-scale', l.imgHoverScale ?? 1.03);
  setVar('--lc-list-img-w', l.imgWidthList ?? '180px');
  setVar('--lc-list-icons-color', l.iconsColor ?? '#64748b');

  setVar('--lc-list-title-size', l.titleSize ?? 16);
  setVar('--lc-list-title-weight', l.titleWeight ?? 600);
  setVar('--lc-list-title-color', l.titleColor ?? '#111827');
  setVar('--lc-list-title-align', l.titleAlign ?? 'left');
  setVar('--lc-list-title-mt', l.titleMt ?? 0);
  setVar('--lc-list-title-mb', l.titleMb ?? 6);
  setVar('--lc-list-title-px', l.titlePx ?? 0);
  setVar('--lc-list-title-py', l.titlePy ?? 0);

  setVar('--lc-list-address-size', l.addressSize ?? 12);
  setVar('--lc-list-address-weight', l.addressWeight ?? 400);
  setVar('--lc-list-address-color', l.addressColor ?? '#6b7280');
  setVar('--lc-list-address-align', l.addressAlign ?? 'left');
  setVar('--lc-list-address-mt', l.addressMt ?? 4);
  setVar('--lc-list-address-mb', l.addressMb ?? 0);
  setVar('--lc-list-address-px', l.addressPx ?? 0);
  setVar('--lc-list-address-py', l.addressPy ?? 0);

  setVar('--lc-list-price-bg', l.priceBg ?? '#ffb800');
  setVar('--lc-list-price-color', l.priceColor ?? '#111827');
  setVar('--lc-list-price-size', l.priceSize ?? 14);
  setVar('--lc-list-price-weight', l.priceWeight ?? 600);
  setVar('--lc-list-price-justify', l.priceJustify ?? 'left');
  setVar('--lc-list-price-mt', l.priceMt ?? 8);
  setVar('--lc-list-price-mb', l.priceMb ?? 0);
  setVar('--lc-list-price-px', l.pricePx ?? 8);
  setVar('--lc-list-price-py', l.pricePy ?? 4);
  setVar('--lc-list-price-radius', l.priceRadius ?? 8);

  setVar('--lc-list-chip-bg', l.chipBg ?? 'rgba(0,0,0,.75)');
  setVar('--lc-list-chip-color', l.chipColor ?? '#fff');
  setVar('--lc-list-chip-border', l.chipBorder ?? 'none');
  setVar('--lc-list-chip-justify', l.chipJustify ?? 'left');
  setVar('--lc-list-chip-fs', l.chipFont ?? 11);
  setVar('--lc-list-chip-px', l.chipPx ?? 8);
  setVar('--lc-list-chip-py', l.chipPy ?? 2);
  setVar('--lc-list-chip-radius', l.chipRadius ?? 999);

  setVar('--lc-list-imgcount-bg', l.imgCounterBg ?? 'rgba(0,0,0,.55)');
  setVar('--lc-list-imgcount-color', l.imgCounterColor ?? '#fff');

  setVar('--lc-list-meta-bg', l.metaBg ?? l.meta?.bg ?? l.meta?.background ?? 'rgba(17,24,39,.06)');
  setVar('--lc-list-meta-color', l.metaColor ?? l.meta?.color ?? '#111827');
  setVar('--lc-list-meta-fs', l.metaFont ?? l.meta?.size ?? 12);
  setVar('--lc-list-meta-weight', l.metaWeight ?? l.meta?.weight ?? 500);
  setVar('--lc-list-meta-px', l.metaPx ?? 8);
  setVar('--lc-list-meta-py', l.metaPy ?? 4);
  setVar('--lc-list-meta-radius', l.metaRadius ?? 8);
  setVar('--lc-list-meta-justify', l.metaJustify ?? 'left');
  setVar('--lc-list-meta-mt', l.metaMt ?? 8);
  setVar('--lc-list-meta-mb', l.metaMb ?? 0);
}

function applyBrand(brand: any) {
  setVar('--brand-primary', brand?.primary_color ?? '#2563eb');
  setVar('--brand-secondary', brand?.secondary_color ?? '#f97316');
  setVar('--brand-text', brand?.text_color ?? '#111827');
  // KLUCZ: globals.css oczekuje --brand-bg i --brand-header-bg
  setVar('--brand-bg', brand?.page_bg ?? '#f8fafc');
  setVar('--brand-header-bg', brand?.header_bg ?? '#ffffff');
  setVar('--brand-radius', brand?.button_radius ?? 12);

  applyListingVars(brand?.listing_card || {});
}

export default function BrandLoader() {
  React.useEffect(() => {
    const fromLS = loadBrandFromLocalStorage() || (globalThis as any).__brand;
    applyBrand(fromLS || {});
    const onUpdated = () => {
      const fresh = loadBrandFromLocalStorage() || (globalThis as any).__brand;
      applyBrand(fresh || {});
    };
    window.addEventListener('houser:brand:updated', onUpdated as any);
    return () => window.removeEventListener('houser:brand:updated', onUpdated as any);
  }, []);
  return null;
}
