// src/lib/brand.ts

/* ======================= Typy ======================= */

export type Align3 = 'left' | 'center' | 'right';

export type ListingCardBlock = {
  cardBg?: string;
  cardRadius?: number;
  cardPx?: number;
  cardPy?: number;
  shadow?: string;

  imgAspect?: string;
  imgCounterBg?: string;
  imgCounterColor?: string;

  titleSize?: number;
  titleWeight?: number;
  titleAlign?: Align3;
  titleMb?: number;

  addressSize?: number;
  addressWeight?: number;
  addressMt?: number;

  priceBg?: string;
  priceColor?: string;
  priceSize?: number;
  priceWeight?: number;
  priceJustify?: Align3;
  priceMt?: number;
  pricePx?: number;
  pricePy?: number;

  chipBg?: string;
  chipColor?: string;
  chipJustify?: Align3;
  chipFont?: number;
  chipPx?: number;
  chipPy?: number;
  chipRadius?: number;

  metaBg?: string;
  metaColor?: string;
  metaRadius?: number;
  metaPx?: number;
  metaPy?: number;
  metaFont?: number;
  metaWeight?: number;
  metaJustify?: Align3;
  metaMt?: number;

  hrShow?: 0 | 1;
  hrColor?: string;
  hrThickness?: number;
  /** NOWE: kontrola odstępów i paddingów poziomej linii */
  hrMt?: number;
  hrMb?: number;
  hrPt?: number;
  hrPb?: number;

  avatarShow?: 0 | 1;
  avatarSize?: number;
  avatarShadow?: string;

  favBg?: string;
  favColor?: string;
  favBgHover?: string;
  favColorHover?: string;
  favBgActive?: string;
  favColorActive?: string;
  favSize?: number;
  favRadius?: number;
  favShadow?: string;
};

export type ListingCardDesignValue = {
  grid?: Partial<ListingCardBlock>;
  list?: Partial<ListingCardBlock>;
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

export const BRAND_STORAGE_KEY = 'houser.brand';
export const BRAND_EVENT = 'houser:brand:updated';

const JUSTIFY: Record<Align3, string> = { left: 'flex-start', center: 'center', right: 'flex-end' };
const TEXT_ALIGN: Record<Align3, string> = { left: 'left', center: 'center', right: 'right' };

/* ======================= Utils ======================= */

function setVar(el: HTMLElement, name: string, value?: string | number | null) {
  if (value === undefined || value === null || value === '') {
    el.style.removeProperty(name);
  } else {
    el.style.setProperty(name, String(value));
  }
}

export function deepMerge<T extends object>(base: T, patch?: Partial<T> | null): T {
  if (!patch) return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
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
  shadow: '0 2px 8px rgba(2,6,23,0.07), 0 12px 32px rgba(2,6,23,0.06)',
  imgAspect: '16 / 9',
  imgCounterBg: 'rgba(0,0,0,.55)',
  imgCounterColor: '#fff',
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
  metaBg: 'rgba(17,24,39,.06)',
  metaColor: '#111827',
  metaRadius: 10,
  metaPx: 10,
  metaPy: 6,
  metaFont: 12,
  metaWeight: 500,
  metaJustify: 'left',
  metaMt: 10,
  hrShow: 0,
  hrColor: 'rgba(17,24,39,.12)',
  hrThickness: 1,
  hrMt: 10,
  hrMb: 10,
  hrPt: 0,
  hrPb: 0,
  avatarShow: 1,
  avatarSize: 28,
  avatarShadow: '0 2px 8px rgba(2,6,23,.08)',
  favBg: 'rgba(255,255,255,.9)',
  favColor: '#111827',
  favBgHover: 'rgba(255,255,255,1)',
  favColorHover: '#0f172a',
  favBgActive: 'rgba(37,99,235,.10)',
  favColorActive: '#2563eb',
  favSize: 36,
  favRadius: 999,
  favShadow: '0 6px 16px rgba(2,6,23,.12)',
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
    list: { ...dBlock, imgAspect: '21 / 9' },
  },
};

export function getDefaultBrand(): BrandPayload {
  return JSON.parse(JSON.stringify(DEFAULT_BRAND));
}

/* ======================= LocalStorage ======================= */

export function saveBrandToLocalStorage(brand: BrandPayload) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brand));
  } catch (e) {
    console.error('Failed to save brand to localStorage:', e);
  }
}

export function loadBrandFromLocalStorage(): BrandPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BRAND_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BrandPayload) : null;
  } catch {
    return null;
  }
}

export function notifyBrandUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(BRAND_EVENT));
}

/* ======================= Nakładanie CSS vars ======================= */

function applyBlock(root: HTMLElement, prefix: '--lc-grid' | '--lc-list', b?: Partial<ListingCardBlock>) {
  const v = deepMerge(dBlock, b || {});

  const mapping: {
    [K in keyof Required<ListingCardBlock>]: { name: string; unit?: string; transform?: (val: any) => string };
  } = {
    cardBg: { name: 'bg' },
    cardRadius: { name: 'radius', unit: 'px' },
    cardPx: { name: 'px', unit: 'px' },
    cardPy: { name: 'py', unit: 'px' },
    shadow: { name: 'shadow' },
    imgAspect: { name: 'img-aspect' },
    imgCounterBg: { name: 'imgcount-bg' },
    imgCounterColor: { name: 'imgcount-color' },
    titleSize: { name: 'title-size', unit: 'px' },
    titleWeight: { name: 'title-weight' },
    titleAlign: { name: 'title-align', transform: (val) => TEXT_ALIGN[val] },
    titleMb: { name: 'title-mb', unit: 'px' },
    addressSize: { name: 'address-size', unit: 'px' },
    addressWeight: { name: 'address-weight' },
    addressMt: { name: 'address-mt', unit: 'px' },
    priceBg: { name: 'price-bg' },
    priceColor: { name: 'price-color' },
    priceSize: { name: 'price-size', unit: 'px' },
    priceWeight: { name: 'price-weight' },
    priceJustify: { name: 'price-justify', transform: (val) => JUSTIFY[val] },
    priceMt: { name: 'price-mt', unit: 'px' },
    pricePx: { name: 'price-px', unit: 'px' },
    pricePy: { name: 'price-py', unit: 'px' },
    chipBg: { name: 'chip-bg' },
    chipColor: { name: 'chip-color' },
    chipJustify: { name: 'chip-justify', transform: (val) => JUSTIFY[val] },
    chipFont: { name: 'chip-fs', unit: 'px' },
    chipPx: { name: 'chip-px', unit: 'px' },
    chipPy: { name: 'chip-py', unit: 'px' },
    chipRadius: { name: 'chip-radius', unit: 'px' },
    metaBg: { name: 'meta-bg' },
    metaColor: { name: 'meta-color' },
    metaRadius: { name: 'meta-radius', unit: 'px' },
    metaPx: { name: 'meta-px', unit: 'px' },
    metaPy: { name: 'meta-py', unit: 'px' },
    metaFont: { name: 'meta-fs', unit: 'px' },
    metaWeight: { name: 'meta-weight' },
    metaJustify: { name: 'meta-justify', transform: (val) => JUSTIFY[val] },
    metaMt: { name: 'meta-mt', unit: 'px' },
    hrShow: { name: 'hr-show' },
    hrColor: { name: 'hr-color' },
    hrThickness: { name: 'hr-thickness', unit: 'px' },
    hrMt: { name: 'hr-mt', unit: 'px' },
    hrMb: { name: 'hr-mb', unit: 'px' },
    hrPt: { name: 'hr-pt', unit: 'px' },
    hrPb: { name: 'hr-pb', unit: 'px' },
    avatarShow: { name: 'avatar-show' },
    avatarSize: { name: 'avatar-size', unit: 'px' },
    avatarShadow: { name: 'avatar-shadow' },
    favBg: { name: 'fav-bg' },
    favColor: { name: 'fav-color' },
    favBgHover: { name: 'fav-bg-hover' },
    favColorHover: { name: 'fav-color-hover' },
    favBgActive: { name: 'fav-bg-active' },
    favColorActive: { name: 'fav-color-active' },
    favSize: { name: 'fav-size', unit: 'px' },
    favRadius: { name: 'fav-radius', unit: 'px' },
    favShadow: { name: 'fav-shadow' },
  };

  for (const key in mapping) {
    const k = key as keyof Required<ListingCardBlock>;
    const config = mapping[k];
    const value = (v as any)[k];
    const finalValue = config.transform ? config.transform(value) : `${value}${config.unit || ''}`;
    setVar(root, `${prefix}-${config.name}`, finalValue);
  }
}

export function normalizeBrand(input?: Partial<BrandPayload> | null): BrandPayload {
  const merged = deepMerge(getDefaultBrand(), input || {});
  merged.listing_card = merged.listing_card || {};
  merged.listing_card.grid = deepMerge(dBlock, merged.listing_card.grid || {});
  merged.listing_card.list = deepMerge({ ...dBlock, imgAspect: '21 / 9' }, merged.listing_card.list || {});
  return merged;
}

export function applyBrandToElement(el: HTMLElement, brand?: Partial<BrandPayload> | null) {
  if (!el) return;
  const b = normalizeBrand(brand);

  // Kolory globalne
  setVar(el, '--brand-primary', b.primary_color);
  setVar(el, '--brand-secondary', b.secondary_color);
  // Kompatybilność: obsłuż obie nazwy zmiennej tła
  setVar(el, '--brand-page-bg', b.page_bg);
  setVar(el, '--brand-bg', b.page_bg);
  setVar(el, '--brand-header-bg', b.header_bg);
  setVar(el, '--brand-text', b.text_color);
  setVar(el, '--brand-button-radius', `${b.button_radius ?? 14}px`);

  // Karty
  applyBlock(el, '--lc-grid', b.listing_card?.grid);
  applyBlock(el, '--lc-list', b.listing_card?.list);
}

export function applyBrandToHtml(brand?: Partial<BrandPayload> | null) {
  if (typeof document === 'undefined') return;
  const payload = brand || loadBrandFromLocalStorage();
  applyBrandToElement(document.documentElement, payload);
}

/* ======================= Presety ======================= */
export const BRAND_PRESETS: Record<string, Partial<BrandPayload>> = {
  'Minimal Light': {},
  'Warm Amber': {},
};
