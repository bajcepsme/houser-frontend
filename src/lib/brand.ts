// src/lib/brand.ts

/* ======================= Typy ======================= */

export type Align3 = 'left' | 'center' | 'right';

export type ListingCardBlock = {
  /* karta */
  cardBg?: string;
  cardRadius?: number;
  cardPx?: number;
  cardPy?: number;

  /* obrazek */
  imgAspect?: string; // '16 / 9', '4 / 3', '1 / 1' itd.

  /* tytuł */
  titleSize?: number;
  titleWeight?: number;
  titleAlign?: Align3;
  titleMb?: number;

  /* adres */
  addressSize?: number;
  addressWeight?: number;
  addressMt?: number;

  /* cena */
  priceBg?: string;
  priceColor?: string;
  priceSize?: number;
  priceWeight?: number;
  priceJustify?: Align3;
  priceMt?: number;
  pricePx?: number;
  pricePy?: number;

  /* chip */
  chipBg?: string;
  chipColor?: string;
  chipJustify?: Align3;
  chipFont?: number;
  chipPx?: number;
  chipPy?: number;
  chipRadius?: number;

  /* licznik zdjęć */
  imgCounterBg?: string;
  imgCounterColor?: string;

  /* meta */
  metaBg?: string;
  metaColor?: string;
  metaRadius?: number;
  metaPx?: number;
  metaPy?: number;
  metaFont?: number;
  metaWeight?: number;
  metaJustify?: Align3;
  metaMt?: number;

  /* cień karty */
  shadow?: string;
};

export type ListingCardDesignValue = {
  grid?: ListingCardBlock;
  list?: ListingCardBlock;
};

export type BrandPayload = {
  title?: string | null;
  tagline?: string | null;
  meta_description?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  page_bg?: string | null;
  header_bg?: string | null;
  text_color?: string | null;
  button_radius?: number | null;
  listing_card?: ListingCardDesignValue | null;
};

/* ======================= Stałe ======================= */

export const LS_KEY = 'houser.brand';
export const BRAND_EVENT = 'houser:brand:updated';

const JUSTIFY: Record<Align3, string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};
const TEXT_ALIGN: Record<Align3, string> = {
  left: 'left',
  center: 'center',
  right: 'right',
};

/* ======================= Utils ======================= */

function setVar(el: HTMLElement, name: string, value?: string | number | null) {
  if (value === undefined || value === null || value === '') return;
  el.style.setProperty(name, String(value));
}

export function deepMerge<T extends object>(base: T, patch?: Partial<T> | null): T {
  if (!patch) return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge((out as any)[k] || {}, v as any);
    } else if (v !== undefined) {
      out[k] = v as any;
    }
  }
  return out;
}

/* ======================= Domyślne wartości ======================= */

const dBlock: Required<ListingCardBlock> = {
  cardBg: '#ffffff',
  cardRadius: 14,
  cardPx: 0,
  cardPy: 0,

  imgAspect: '16 / 9',

  titleSize: 16,
  titleWeight: 700,
  titleAlign: 'left',
  titleMb: 0,

  addressSize: 12,
  addressWeight: 400,
  addressMt: 4,

  priceBg: '#ffb800',
  priceColor: '#111827',
  priceSize: 14,
  priceWeight: 600,
  priceJustify: 'left',
  priceMt: 8,
  pricePx: 10,
  pricePy: 6,

  chipBg: 'rgba(0,0,0,.65)',
  chipColor: '#fff',
  chipJustify: 'left',
  chipFont: 12,
  chipPx: 10,
  chipPy: 4,
  chipRadius: 999,

  imgCounterBg: 'rgba(0,0,0,.55)',
  imgCounterColor: '#fff',

  metaBg: 'rgba(17,24,39,.06)',
  metaColor: '#111827',
  metaRadius: 10,
  metaPx: 10,
  metaPy: 6,
  metaFont: 12,
  metaWeight: 500,
  metaJustify: 'left',
  metaMt: 10,

  shadow: '0 2px 8px rgba(2,6,23,0.07), 0 12px 32px rgba(2,6,23,0.06)',
};

export const DEFAULT_BRAND: BrandPayload = {
  title: 'Houser.pl',
  tagline: 'Nowoczesny serwis nieruchomości',
  meta_description: 'Szukaj i publikuj ogłoszenia nieruchomości',
  logo_url: '',
  favicon_url: '',
  primary_color: '#2563eb',
  secondary_color: '#f97316',
  page_bg: '#f6f8fb',
  header_bg: '#ffffff',
  text_color: '#0f172a',
  button_radius: 14,
  listing_card: {
    grid: { ...dBlock },
    // List ma z definicji „szersze” zdjęcie – lepsze dla horyzontalnych kafli
    list: { ...dBlock, imgAspect: '21 / 9' },
  },
};

export function getDefaultBrand(): BrandPayload {
  // zwracamy kopię, by nic nie mutowało stałej
  return JSON.parse(JSON.stringify(DEFAULT_BRAND));
}

/* ======================= LocalStorage ======================= */

// --- STORAGE KEY (stabilny) ---
export const BRAND_STORAGE_KEY = 'houser.brand.v1';

// --- ZAPIS: zapisujemy CAŁY payload (łącznie z logo, title, SEO) ---
export function saveBrandToLocalStorage(brand: BrandPayload) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brand));
  } catch {}
}

// --- ODCZYT: mergujemy z defaultem i normalizujemy ---
export function loadBrandFromLocalStorage(): BrandPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BRAND_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BrandPayload>;
    // dbamy, żeby brakujące pola dostały defaulty:
    return normalizeBrand(deepMerge(DEFAULT_BRAND, parsed));
  } catch {
    return null;
  }
}

export function notifyBrandUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(BRAND_EVENT));
}

/* ======================= Nakładanie CSS vars ======================= */

function applyBlock(root: HTMLElement, prefix: '--lc-grid' | '--lc-list', b?: ListingCardBlock) {
  const v = deepMerge(dBlock, b || {});

  setVar(root, `${prefix}-bg`, v.cardBg);
  setVar(root, `${prefix}-radius`, v.cardRadius + 'px');
  setVar(root, `${prefix}-px`, v.cardPx + 'px');
  setVar(root, `${prefix}-py`, v.cardPy + 'px');

  setVar(root, `${prefix}-img-aspect`, v.imgAspect);
  setVar(root, `${prefix}-img-ratio`, v.imgAspect);

  setVar(root, `${prefix}-title-size`, v.titleSize + 'px');
  setVar(root, `${prefix}-title-weight`, v.titleWeight);
  setVar(root, `${prefix}-title-align`, TEXT_ALIGN[v.titleAlign]);
  setVar(root, `${prefix}-title-mb`, v.titleMb + 'px');

  setVar(root, `${prefix}-address-size`, v.addressSize + 'px');
  setVar(root, `${prefix}-address-weight`, v.addressWeight);
  setVar(root, `${prefix}-address-mt`, v.addressMt + 'px');

  setVar(root, `${prefix}-price-bg`, v.priceBg);
  setVar(root, `${prefix}-price-color`, v.priceColor);
  setVar(root, `${prefix}-price-size`, v.priceSize + 'px');
  setVar(root, `${prefix}-price-weight`, v.priceWeight);
  setVar(root, `${prefix}-price-justify`, JUSTIFY[v.priceJustify]);
  setVar(root, `${prefix}-price-mt`, v.priceMt + 'px');
  setVar(root, `${prefix}-price-px`, v.pricePx + 'px');
  setVar(root, `${prefix}-price-py`, v.pricePy + 'px');

  setVar(root, `${prefix}-chip-bg`, v.chipBg);
  setVar(root, `${prefix}-chip-color`, v.chipColor);
  setVar(root, `${prefix}-chip-justify`, JUSTIFY[v.chipJustify]);
  setVar(root, `${prefix}-chip-fs`, v.chipFont + 'px');
  setVar(root, `${prefix}-chip-px`, v.chipPx + 'px');
  setVar(root, `${prefix}-chip-py`, v.chipPy + 'px');
  setVar(root, `${prefix}-chip-radius`, v.chipRadius + 'px');

  setVar(root, `${prefix}-imgcount-bg`, v.imgCounterBg);
  setVar(root, `${prefix}-imgcount-color`, v.imgCounterColor);

  setVar(root, `${prefix}-meta-bg`, (b as any)?.metaBg ?? (b as any)?.meta?.background ?? v.metaBg);
  setVar(root, `${prefix}-meta-color`, v.metaColor);
  setVar(root, `${prefix}-meta-radius`, v.metaRadius + 'px');
  setVar(root, `${prefix}-meta-px`, v.metaPx + 'px');
  setVar(root, `${prefix}-meta-py`, v.metaPy + 'px');
  setVar(root, `${prefix}-meta-fs`, v.metaFont + 'px');
  setVar(root, `${prefix}-meta-weight`, v.metaWeight);
  setVar(root, `${prefix}-meta-justify`, JUSTIFY[v.metaJustify]);
  setVar(root, `${prefix}-meta-mt`, v.metaMt + 'px');

  setVar(root, `${prefix}-shadow`, v.shadow);
}

export function normalizeBrand(input?: Partial<BrandPayload> | null): BrandPayload {
  const merged = deepMerge(getDefaultBrand(), input || {});
  // gwarantujemy obie sekcje
  merged.listing_card = merged.listing_card || {};
  merged.listing_card.grid = deepMerge(dBlock, merged.listing_card.grid || {});
  merged.listing_card.list = deepMerge({ ...dBlock, imgAspect: '21 / 9' }, merged.listing_card.list || {});
  return merged;
}

export function applyBrandToElement(el: HTMLElement, brand?: Partial<BrandPayload> | null) {
  if (!el) return;
  const b = normalizeBrand(brand);

  setVar(el, '--brand-primary', b.primary_color ?? '#2563eb');
  setVar(el, '--brand-secondary', b.secondary_color ?? '#f97316');
  setVar(el, '--brand-page-bg', b.page_bg ?? '#f6f8fb');
  setVar(el, '--brand-header-bg', b.header_bg ?? '#ffffff');
  setVar(el, '--brand-text', b.text_color ?? '#0f172a');
  setVar(el, '--brand-button-radius', String(b.button_radius ?? 14) + 'px');

  applyBlock(el, '--lc-grid', b.listing_card?.grid || undefined);
  applyBlock(el, '--lc-list', b.listing_card?.list || undefined);
}

export function applyBrandToHtml(brand?: Partial<BrandPayload> | null) {
  if (typeof document === 'undefined') return;
  applyBrandToElement(document.documentElement, brand ?? loadBrandFromLocalStorage());
}

/* ======================= Presety (jasne) ======================= */

export const BRAND_PRESETS: Record<string, Partial<BrandPayload>> = {
  'Minimal Light': {
    page_bg: '#f6f8fb',
    text_color: '#0f172a',
    listing_card: {
      grid: { cardBg: '#ffffff', shadow: '0 2px 8px rgba(2,6,23,.06), 0 14px 34px rgba(2,6,23,.06)' },
      list: { cardBg: '#ffffff', imgAspect: '21 / 9', shadow: '0 2px 8px rgba(2,6,23,.06), 0 14px 34px rgba(2,6,23,.06)' },
    },
  },
  'Warm Amber': {
    page_bg: '#faf7f2',
    text_color: '#0b1220',
    listing_card: {
      grid: { cardBg: '#ffffff', priceBg: '#fde68a', priceColor: '#0b1220', chipBg: 'rgba(180,83,9,.14)', chipColor: '#78350f' },
      list: { cardBg: '#ffffff', imgAspect: '21 / 9', priceBg: '#fde68a', priceColor: '#0b1220', chipBg: 'rgba(180,83,9,.14)', chipColor: '#78350f' },
    },
  },
  'Soft Sage': {
    page_bg: '#f5f8f6',
    text_color: '#0f172a',
    listing_card: {
      grid: { cardBg: '#ffffff', priceBg: '#dcfce7', priceColor: '#065f46', chipBg: 'rgba(16,185,129,.14)', chipColor: '#065f46' },
      list: { cardBg: '#ffffff', imgAspect: '21 / 9', priceBg: '#dcfce7', priceColor: '#065f46', chipBg: 'rgba(16,185,129,.14)', chipColor: '#065f46' },
    },
  },
  'Silver Frost': {
    page_bg: '#f4f6f8',
    text_color: '#0f172a',
    listing_card: {
      grid: { cardBg: '#ffffff', priceBg: '#e5e7eb', priceColor: '#0f172a', chipBg: 'rgba(55,65,81,.12)', chipColor: '#111827' },
      list: { cardBg: '#ffffff', imgAspect: '21 / 9', priceBg: '#e5e7eb', priceColor: '#0f172a', chipBg: 'rgba(55,65,81,.12)', chipColor: '#111827' },
    },
  },
  'Coral Accent': {
    page_bg: '#fff7f5',
    text_color: '#0f172a',
    listing_card: {
      grid: { cardBg: '#ffffff', priceBg: '#ffe4e6', priceColor: '#be123c', chipBg: 'rgba(244,63,94,.14)', chipColor: '#9f1239' },
      list: { cardBg: '#ffffff', imgAspect: '21 / 9', priceBg: '#ffe4e6', priceColor: '#be123c', chipBg: 'rgba(244,63,94,.14)', chipColor: '#9f1239' },
    },
  },
  'Nordic Air': {
    page_bg: '#f3f7fb',
    text_color: '#0f172a',
    listing_card: {
      grid: { cardBg: '#ffffff', priceBg: '#dbeafe', priceColor: '#1e3a8a', chipBg: 'rgba(37,99,235,.14)', chipColor: '#1e3a8a' },
      list: { cardBg: '#ffffff', imgAspect: '21 / 9', priceBg: '#dbeafe', priceColor: '#1e3a8a', chipBg: 'rgba(37,99,235,.14)', chipColor: '#1e3a8a' },
    },
  },
  'Sandstone': {
    page_bg: '#faf6f0',
    text_color: '#0f172a',
    listing_card: {
      grid: { cardBg: '#ffffff', priceBg: '#fdecc8', priceColor: '#78350f', chipBg: 'rgba(217,119,6,.14)', chipColor: '#7c2d12' },
      list: { cardBg: '#ffffff', imgAspect: '21 / 9', priceBg: '#fdecc8', priceColor: '#78350f', chipBg: 'rgba(217,119,6,.14)', chipColor: '#7c2d12' },
    },
  },
  'Lavender Mist': {
    page_bg: '#faf7ff',
    text_color: '#0f172a',
    listing_card: {
      grid: { cardBg: '#ffffff', priceBg: '#ede9fe', priceColor: '#5b21b6', chipBg: 'rgba(124,58,237,.14)', chipColor: '#5b21b6' },
      list: { cardBg: '#ffffff', imgAspect: '21 / 9', priceBg: '#ede9fe', priceColor: '#5b21b6', chipBg: 'rgba(124,58,237,.14)', chipColor: '#5b21b6' },
    },
  },
  'Ocean Breeze': {
    page_bg: '#f0f8ff',
    text_color: '#0f172a',
    listing_card: {
      grid: { cardBg: '#ffffff', priceBg: '#cffafe', priceColor: '#155e75', chipBg: 'rgba(14,165,233,.14)', chipColor: '#0e7490' },
      list: { cardBg: '#ffffff', imgAspect: '21 / 9', priceBg: '#cffafe', priceColor: '#155e75', chipBg: 'rgba(14,165,233,.14)', chipColor: '#0e7490' },
    },
  },
  'Mossy': {
    page_bg: '#f3f7f3',
    text_color: '#0f172a',
    listing_card: {
      grid: { cardBg: '#ffffff', priceBg: '#e2f3e6', priceColor: '#14532d', chipBg: 'rgba(34,197,94,.14)', chipColor: '#166534' },
      list: { cardBg: '#ffffff', imgAspect: '21 / 9', priceBg: '#e2f3e6', priceColor: '#14532d', chipBg: 'rgba(34,197,94,.14)', chipColor: '#166534' },
    },
  },
  'Creamy Lime': {
    page_bg: '#fbfdf7',
    text_color: '#0f172a',
    listing_card: {
      grid: { cardBg: '#ffffff', priceBg: '#ecfccb', priceColor: '#3f6212', chipBg: 'rgba(132,204,22,.16)', chipColor: '#365314' },
      list: { cardBg: '#ffffff', imgAspect: '21 / 9', priceBg: '#ecfccb', priceColor: '#3f6212', chipBg: 'rgba(132,204,22,.16)', chipColor: '#365314' },
    },
  },
};
