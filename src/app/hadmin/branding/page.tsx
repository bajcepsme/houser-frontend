'use client';

import * as React from 'react';
import {
  DEFAULT_BRAND,
  normalizeBrand,
  deepMerge,
  loadBrandFromLocalStorage,
  saveBrandToLocalStorage,
  applyBrandToElement,
  applyBrandToHtml,
  notifyBrandUpdated,
  type BrandPayload,
  type ListingCardBlock,
} from '@/lib/brand';
import {
  Camera, MapPin, Upload, Download, Save, RefreshCcw, Plus, Trash, ChevronDown, ChevronRight, Heart,
} from 'lucide-react';
import { adminApi } from '@/lib/adminApi';

/* ================= utils skrócone ================= */

const PREVIEW_IMGS = [
  'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1400&q=80',
];

const DEFAULT_AVATAR = '/avatars/default.jpg';
const OWNER_AVATARS = ['/avatars/m1.jpg', '/avatars/f1.jpg', '/avatars/m2.jpg'];
const TRANSPARENT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

function clsx(...a: (string | false | null | undefined)[]) { return a.filter(Boolean).join(' '); }

function hexToRgb(hex: string) {
  const h = hex.replace('#', '').trim();
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(n, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbOrHexToHex(input: string) {
  if (!input) return '#ffffff';
  if (/^#/.test(input)) return input;
  const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return '#ffffff';
  const r = Number(m[1]), g = Number(m[2]), b = Number(m[3]);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex || '#000000');
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/** Natychmiastowe wymuszenie tła strony (live preview + brak „mrugnięcia” w edytorze) */
function forcePageBgImportant(bg?: string | null) {
  if (typeof document === 'undefined' || !bg) return;
  const id = 'brand-page-bg-important';
  let tag = document.getElementById(id) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement('style');
    tag.id = id;
    document.head.appendChild(tag);
  }
  tag.textContent = `html,body{background:${bg} !important;}`;
}

/* =============== drobne komponenty (bez zmian istotnych w logice) =============== */

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-3">
      <h2 className="font-semibold">{title}</h2>
      {right}
    </div>
  );
}
function Row({ cols = 2, children }: { cols?: 1 | 2 | 3 | 4; children: React.ReactNode }) {
  const grid = { 1: 'grid-cols-1', 2: 'grid-cols-1 md:grid-cols-2', 3: 'grid-cols-1 md:grid-cols-3', 4: 'grid-cols-1 md:grid-cols-4' }[cols];
  return <div className={clsx('grid gap-4', grid)}>{children}</div>;
}

function TextField({ label, value, onChange, placeholder, id }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; id?: string;
}) {
  return (
    <label className="block space-y-1" htmlFor={id}>
      <div className="text-sm font-medium">{label}</div>
      <input
        id={id}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function TextAreaField({ label, value, onChange, placeholder, id }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; id?: string;
}) {
  return (
    <label className="block space-y-1" htmlFor={id}>
      <div className="text-sm font-medium">{label}</div>
      <textarea
        id={id}
        className="w-full min-h-[90px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function SelectField({ label, value, onChange, options, id }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][]; id?: string;
}) {
  return (
    <label className="block space-y-1" htmlFor={id}>
      <div className="text-sm font-medium">{label}</div>
      <select
        id={id}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
function RangeField({ id, label, value, min, max, step, onChange, unit = 'px' }: {
  id?: string; label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void;
}) {
  const handle = (n: number) => onChange(n);
  return (
    <label className="block space-y-1" htmlFor={id}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-gray-800">{Number.isFinite(value) ? value : 0}{unit}</span>
      </div>
      <input
        id={id}
        type="range"
        className="w-full"
        min={min}
        max={max}
        step={step ?? 1}
        value={Number(value ?? 0)}
        onChange={(e) => handle(Number(e.target.value))}
        onInput={(e) => handle(Number((e.target as HTMLInputElement).value))} // live
      />
    </label>
  );
}
function CheckboxField({ label, checked, onChange, id }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; id?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input id={id} type="checkbox" className="h-4 w-4 rounded border-gray-300" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
function Accordion({ title, defaultOpen = false, children, right }: {
  title: string; defaultOpen?: boolean; right?: React.ReactNode; children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <button type="button" className="flex w-full items-center justify-between px-5 py-3 text-left" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 opacity-70" /> : <ChevronRight className="h-4 w-4 opacity-70" />}
          <span className="font-semibold">{title}</span>
        </div>
        {right}
      </button>
      {open && <div className="space-y-3 px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

/* =================== elementy podglądu (jak wcześniej) =================== */

function Chip({ scope, text }: { scope: 'grid' | 'list'; text: string }) {
  const P = scope === 'grid' ? '--lc-grid' : '--lc-list';
  return (
    <span
      className="inline-flex items-center font-semibold"
      style={{
        background: `var(${P}-chip-bg)`,
        color: `var(${P}-chip-color)`,
        fontSize: `var(${P}-chip-fs)`,
        padding: `var(${P}-chip-py) var(${P}-chip-px)`,
        borderRadius: `var(${P}-chip-radius)`,
      }}
    >
      {text}
    </span>
  );
}
function MetaPill({ scope, children }: { scope: 'grid' | 'list'; children: React.ReactNode }) {
  const P = scope === 'grid' ? '--lc-grid' : '--lc-list';
  return (
    <span
      className="inline-flex"
      style={{
        background: `var(${P}-meta-bg)`,
        color: `var(${P}-meta-color)`,
        fontSize: `var(${P}-meta-fs)`,
        fontWeight: `var(${P}-meta-weight)` as any,
        padding: `var(${P}-meta-py) var(${P}-meta-px)`,
        borderRadius: `var(${P}-meta-radius)`,
      }}
    >
      {children}
    </span>
  );
}
function PriceBadge({ scope, children }: { scope: 'grid' | 'list'; children: React.ReactNode }) {
  const P = scope === 'grid' ? '--lc-grid' : '--lc-list';
  return (
    <span
      className="inline-flex rounded-md"
      style={{
        background: `var(${P}-price-bg)`,
        color: `var(${P}-price-color)`,
        fontSize: `var(${P}-price-size)`,
        fontWeight: `var(${P}-price-weight)` as any,
        padding: `var(${P}-price-py) var(${P}-price-px)`,
      }}
    >
      {children}
    </span>
  );
}
function FavBtn({ scope }: { scope: 'grid' | 'list' }) {
  const P = scope === 'grid' ? '--lc-grid' : '--lc-list';
  return (
    <button
      type="button"
      className="brand-fav-btn inline-flex items-center justify-center"
      data-scope={scope}
      aria-label="Dodaj do ulubionych"
      style={{
        width: `var(${P}-fav-size, 36px)`,
        height: `var(${P}-fav-size, 36px)`,
        borderRadius: `var(${P}-fav-radius, 999px)`,
        boxShadow: `var(${P}-fav-shadow, 0 6px 16px rgba(2,6,23,.12))`,
      }}
    >
      <Heart className="h-4 w-4" />
    </button>
  );
}
function getCounterPos(pos?: string) {
  const p = (pos || 'bl').toLowerCase();
  if (p === 'tl') return { top: '8px', left: '8px' };
  if (p === 'tr') return { top: '8px', right: '8px' };
  if (p === 'br') return { bottom: '8px', right: '8px' };
  return { bottom: '8px', left: '8px' };
}
function HrPreview({ scope, design }: { scope: 'grid' | 'list'; design: Partial<ListingCardBlock> }) {
  const any = design as any;
  const show = Boolean(any.hrShow ?? 0);
  if (!show) return null;
  const S: React.CSSProperties = {
    height: `${any.hrThickness ?? 1}px`,
    background: any.hrColor ?? 'rgba(17,24,39,.12)',
    marginTop: `${any.hrMt ?? 12}px`,
    marginBottom: `${any.hrMb ?? 12}px`,
    paddingTop: `${any.hrPt ?? 0}px`,
    paddingBottom: `${any.hrPb ?? 0}px`,
    borderRadius: 999,
  };
  return <div aria-hidden style={S} />;
}
function GridPreviewCard({ i, design }: { i: number; design: Partial<ListingCardBlock> }) {
  const img = PREVIEW_IMGS[i % PREVIEW_IMGS.length];
  const P = '--lc-grid';
  const d = design as any;
  const counterStyle: React.CSSProperties = {
    background: `var(${P}-imgcount-bg)`,
    color: `var(${P}-imgcount-color)`,
    fontSize: `${d.imgCounterFont ?? 11}px`,
    padding: `${d.imgCounterPy ?? 2}px ${d.imgCounterPx ?? 6}px`,
    position: 'absolute',
    borderRadius: 999,
    ...getCounterPos(d.imgCounterPos),
  };
  return (
    <div className="group relative overflow-hidden transition" style={{
      borderRadius: `var(${P}-radius)`, background: `var(${P}-bg)`, boxShadow: `var(${P}-shadow)`,
      padding: `calc(var(${P}-card-py, 0px)) calc(var(${P}-card-px, 0px))`,
    }}>
      <div className="relative overflow-hidden" style={{ aspectRatio: `var(${P}-img-aspect)` as any }}>
        <img src={img} alt="" className="h-full w-full object-cover" />
        <div className="absolute left-0 right-0 top-2 flex px-2" style={{ justifyContent: `var(${P}-chip-justify)` as any }}>
          <Chip scope="grid" text="Sprzedaż" />
        </div>
        <div className="inline-flex items-center gap-1" style={counterStyle}>
          <Camera className="h-[14px] w-[14px]" />
          <span>7</span>
        </div>
        <div className="absolute right-2 top-2"><FavBtn scope="grid" /></div>
      </div>
      <div className="p-3">
        <div className="line-clamp-2 text-gray-900" style={{
          marginBottom: `var(${P}-title-mb)`,
          fontWeight: `var(${P}-title-weight)` as any,
          fontSize: `var(${P}-title-size)`,
          textAlign: `var(${P}-title-align)` as any,
        }}>
          Dwupokojowe mieszkanie na nowym osiedlu
        </div>
        <div className="inline-flex items-center gap-1 text-gray-600" style={{
          marginTop: `var(${P}-address-mt)`,
          fontSize: `var(${P}-address-size)`,
          fontWeight: `var(${P}-address-weight)` as any,
        }}>
          <MapPin className="h-3.5 w-3.5 opacity-70" />
          <span>Poznań, Rataje</span>
        </div>
        <div className="flex items-center" style={{ justifyContent: `var(${P}-price-justify)` as any, marginTop: `var(${P}-price-mt)` }}>
          <PriceBadge scope="grid">749 000 zł</PriceBadge>
        </div>
        <HrPreview scope="grid" design={design} />
        <div className="mt-2 flex items-center justify-between gap-3" style={{ marginTop: `var(${P}-meta-mt)` }}>
          <div className="flex gap-2" style={{ justifyContent: `var(${P}-meta-justify)` as any }}>
            <MetaPill scope="grid">52 m²</MetaPill>
            <MetaPill scope="grid">14 400 zł/m²</MetaPill>
          </div>
          <div className="shrink-0 overflow-hidden rounded-full ring-1 ring-black/5" style={{
            width: `var(${P}-avatar-size, 28px)`, height: `var(${P}-avatar-size, 28px)`,
            boxShadow: `var(${P}-avatar-shadow, 0 2px 8px rgba(2,6,23,.08))`, opacity: `var(${P}-avatar-show, 1)`,
          }} title="Avatar">
            <img src={OWNER_AVATARS[i % OWNER_AVATARS.length] || DEFAULT_AVATAR}
                 onError={(e) => ((e.currentTarget.src = DEFAULT_AVATAR))}
                 alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
}
function ListPreviewCard({ i, design }: { i: number; design: Partial<ListingCardBlock> }) {
  const img = PREVIEW_IMGS[i % PREVIEW_IMGS.length];
  const P = '--lc-list';
  const d = design as any;
  const counterStyle: React.CSSProperties = {
    background: `var(${P}-imgcount-bg)`,
    color: `var(${P}-imgcount-color)`,
    fontSize: `${d.imgCounterFont ?? 11}px`,
    padding: `${d.imgCounterPy ?? 2}px ${d.imgCounterPx ?? 6}px`,
    position: 'absolute',
    borderRadius: 999,
    ...getCounterPos(d.imgCounterPos),
  };
  return (
    <div className="grid grid-cols-[180px_1fr] gap-3 overflow-hidden transition" style={{
      borderRadius: `var(${P}-radius)`, background: `var(${P}-bg)`, boxShadow: `var(${P}-shadow)`,
      padding: `calc(var(${P}-card-py, 0px)) calc(var(${P}-card-px, 0px))`,
    }}>
      <div className="relative overflow-hidden" style={{ aspectRatio: `var(${P}-img-aspect)` as any }}>
        <img src={img} alt="" className="h-full w-full object-cover" />
        <div className="absolute left-0 right-0 top-2 flex px-2" style={{ justifyContent: `var(${P}-chip-justify)` as any }}>
          <Chip scope="list" text="Wynajem" />
        </div>
        <div className="inline-flex items-center gap-1" style={counterStyle}>
          <Camera className="h-[14px] w-[14px]" />
          <span>12</span>
        </div>
        <div className="absolute right-2 top-2"><FavBtn scope="list" /></div>
      </div>
      <div className="p-3">
        <div className="line-clamp-2 text-gray-900" style={{
          marginBottom: `var(${P}-title-mb)`,
          fontWeight: `var(${P}-title-weight)` as any,
          fontSize: `var(${P}-title-size)`,
          textAlign: `var(${P}-title-align)` as any,
        }}>
          Przytulne 2 pokoje, wysoki standard
        </div>
        <div className="inline-flex items-center gap-1 text-gray-600" style={{
          marginTop: `var(${P}-address-mt)`,
          fontSize: `var(${P}-address-size)`,
          fontWeight: `var(${P}-address-weight)` as any,
        }}>
          <MapPin className="h-3.5 w-3.5 opacity-70" />
          <span>Warszawa, Mokotów</span>
        </div>
        <div className="flex items-center" style={{ justifyContent: `var(${P}-price-justify)` as any, marginTop: `var(${P}-price-mt)` }}>
          <PriceBadge scope="list">3 200 zł / m-c</PriceBadge>
        </div>
        <HrPreview scope="list" design={design} />
        <div className="mt-2 flex items-center justify-between gap-3" style={{ marginTop: `var(${P}-meta-mt)` }}>
          <div className="flex gap-2" style={{ justifyContent: `var(${P}-meta-justify)` as any }}>
            <MetaPill scope="list">64 m²</MetaPill>
            <MetaPill scope="list">50 zł/m²</MetaPill>
          </div>
          <div className="shrink-0 overflow-hidden rounded-full ring-1 ring-black/5" style={{
            width: `var(${P}-avatar-size, 28px)`, height: `var(${P}-avatar-size, 28px)`,
            boxShadow: `var(${P}-avatar-shadow, 0 2px 8px rgba(2,6,23,.08))`, opacity: `var(${P}-avatar-show, 1)`,
          }} title="Avatar">
            <img src={OWNER_AVATARS[(i + 1) % OWNER_AVATARS.length] || DEFAULT_AVATAR}
                 onError={(e) => ((e.currentTarget.src = DEFAULT_AVATAR))}
                 alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== STRONA ============================== */

export default function AdminBrandingPage() {
  // 1) Stabilny stan startowy, bez localStorage w renderze (eliminuje hydration diff)
  const [form, setForm] = React.useState<BrandPayload>(() => normalizeBrand(DEFAULT_BRAND));
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // 2) Po mount – dopiero wtedy bierzemy LS i przykładamy do podglądu
  React.useEffect(() => {
    const fromLs = loadBrandFromLocalStorage();
    if (fromLs) {
      const next = normalizeBrand(fromLs);
      setForm(next);
      // natychmiastowe CSS vars na obszarze podglądu i globalne tło
      applyBrandToHtml(next);
      if (next.page_bg) forcePageBgImportant(next.page_bg);
    }
  }, []);

  // 3) Podgląd – aplikujemy CSS vars do kontenera za każdym razem
  const previewRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (previewRef.current) {
      applyBrandToElement(previewRef.current, form);
      // licznik zdjęć – kolory (gwarantujemy zgodność z Home)
      const root = previewRef.current;
      const g: any = form.listing_card?.grid || {};
      const l: any = form.listing_card?.list || {};
      root.style.setProperty('--lc-grid-imgcount-bg', g.imgCounterBg ?? 'rgba(0,0,0,.55)');
      root.style.setProperty('--lc-grid-imgcount-color', g.imgCounterColor ?? '#fff');
      root.style.setProperty('--lc-list-imgcount-bg', l.imgCounterBg ?? 'rgba(0,0,0,.55)');
      root.style.setProperty('--lc-list-imgcount-color', l.imgCounterColor ?? '#fff');
    }
  }, [form]);

  // 4) Helpery formularza
  const update = React.useCallback(<K extends keyof BrandPayload>(k: K, v: BrandPayload[K]) => {
    setForm((s) => normalizeBrand({ ...s, [k]: v }));
    if (k === 'page_bg') forcePageBgImportant(String(v || '')); // LIVE podczas przesuwania suwaka
    if (k === 'header_bg') applyBrandToHtml({ ...form, header_bg: v }); // szybki podgląd headera
  }, [form]);

  const setDesign = React.useCallback((scope: 'grid' | 'list', patch: Partial<ListingCardBlock>) => {
    setForm((s) => {
      const next: BrandPayload = {
        ...s,
        listing_card: {
          ...(s.listing_card || {}),
          [scope]: { ...(s.listing_card?.[scope] || {}), ...patch },
        },
      };
      return normalizeBrand(next);
    });
  }, []);

  // 5) Presety (lokalne)
  const PRESETS_KEY = 'houser.brand.userpresets';
  const loadUserPresets = () => {
    try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || '{}'); } catch { return {}; }
  };
  const saveUserPresets = (data: Record<string, Partial<BrandPayload>>) => {
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(data)); } catch {}
  };

  const [userPresets, setUserPresets] = React.useState<Record<string, Partial<BrandPayload>>>({});
  React.useEffect(() => { setUserPresets(loadUserPresets()); }, []);

  const applyUserPreset = (name: string) => {
    const preset = userPresets[name];
    if (!preset) return;
    setForm((s) => normalizeBrand(deepMerge(s, preset)));
    setMsg(`Zastosowano preset: ${name}`);
  };
  const saveAsPreset = () => {
    const name = window.prompt('Nazwa nowego presetu (np. „Modern Lime”)');
    if (!name) return;
    const all = { ...loadUserPresets(), [name]: { ...form } };
    saveUserPresets(all);
    setUserPresets(all);
    setMsg(`Zapisano preset „${name}”`);
  };
  const deletePreset = (name: string) => {
    if (!window.confirm(`Usunąć preset "${name}"?`)) return;
    const all = { ...loadUserPresets() };
    delete all[name];
    saveUserPresets(all);
    setUserPresets(all);
    setMsg(`Usunięto preset „${name}”`);
  };

  // 6) Akcje
  const handleExport = () => {
    const data = JSON.stringify(form, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `brand-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url); a.remove();
  };
  const handleImport = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = normalizeBrand(JSON.parse(text));
      setForm(parsed);
      setMsg('Zaimportowano ustawienia z pliku JSON.');
      forcePageBgImportant(parsed.page_bg);
      applyBrandToHtml(parsed);
    } catch {
      setErr('Nie udało się zaimportować pliku JSON.');
    }
  };
  const handleReset = () => {
    if (!window.confirm('Przywrócić ustawienia domyślne?')) return;
    const next = normalizeBrand(DEFAULT_BRAND);
    setForm(next);
    setMsg('Przywrócono ustawienia domyślne.');
    forcePageBgImportant(next.page_bg);
    applyBrandToHtml(next);
  };
  const handleSave = async () => {
    setSaving(true); setMsg(null); setErr(null);
    try {
      await adminApi.saveBrand?.(form);
      saveBrandToLocalStorage(form);
      applyBrandToHtml(form);
      forcePageBgImportant(form.page_bg);
      notifyBrandUpdated();
      setMsg('Zapisano i zastosowano na froncie 🎉');
    } catch (e: any) {
      setErr(e?.message || 'Błąd zapisu.');
    } finally { setSaving(false); }
  };

  const gridDesign = form.listing_card?.grid || {};
  const listDesign = form.listing_card?.list || {};

  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const handlePickLogo = async (f?: File) => {
  if (!f) return;
  setSaving(true);
  setMsg(null);
  setErr(null);
  try {
    const res = await adminApi.uploadLogo?.(f);
    const newUrl = (res && (res.url || res.logo_url)) || '';
    // ustawiamy w formularzu
    update('logo_url', String(newUrl));
    // opcjonalnie: szybki podgląd bez zapisu do backendu
    applyBrandToHtml({ ...form, logo_url: String(newUrl) });
  } catch (e: any) {
    setErr(e?.message || 'Nie udało się wgrać logo.');
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Branding</h1>
        <p className="text-gray-600">Kolory, logo, SEO i wygląd kart – z podglądem na żywo.</p>
      </div>

      <div className="mb-4 space-y-2">
        {msg && <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{msg}</div>}
        {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <Accordion title="Tożsamość marki (logo, tytuł, SEO)" defaultOpen>
            <Row cols={2}>
              <TextField label="Tytuł witryny" value={form.title ?? ''} onChange={(v) => update('title', v)} />
              <TextField label="Favicon (URL)" value={form.favicon_url ?? ''} onChange={(v) => update('favicon_url', v)} placeholder="https://example.com/favicon.png" />
            </Row>
            <Row cols={2}>
              <TextField label="Tagline (krótkie hasło)" value={form.tagline ?? ''} onChange={(v) => update('tagline', v)} />
              <TextAreaField label="Meta opis (SEO)" value={form.meta_description ?? ''} onChange={(v) => update('meta_description', v)} />
            </Row>

            <div className="mt-4">
              <div className="mb-1 text-sm font-medium">Logo (PNG/SVG/JPEG/WEBP)</div>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded border bg-white">
                  {/* ZAWSZE IMG → brak zamiany elementu w trakcie hydracji */}
                  <img
                    src={form.logo_url || TRANSPARENT_PNG}
                    alt="logo"
                    className="h-full w-full object-contain"
                  />
                  {!form.logo_url && <div className="absolute text-xs text-gray-500">Brak</div>}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4" /> Wybierz z dysku
                  </button>
                  <input ref={fileRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp,.svg"
                         className="hidden" onChange={(e) => handlePickLogo(e.target.files?.[0] || undefined)} />
                  {form.logo_url && (
                    <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                      onClick={() => update('logo_url', '')}>
                      <Trash className="h-4 w-4" /> Usuń logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Accordion>

          <Accordion title="Kolory i tła strony (global)" defaultOpen>
            <Row cols={3}>
              <ColorField label="Kolor wiodący (primary)" value={form.primary_color || '#2563eb'} onChange={(v, live) => { update('primary_color', v); if (live) applyBrandToHtml({ ...form, primary_color: v }); }} />
              <ColorField label="Kolor dodatkowy (secondary)" value={form.secondary_color || '#f97316'} onChange={(v, live) => { update('secondary_color', v); if (live) applyBrandToHtml({ ...form, secondary_color: v }); }} />
              <ColorField label="Kolor tekstu" value={form.text_color || '#0f172a'} onChange={(v, live) => { update('text_color', v); if (live) applyBrandToHtml({ ...form, text_color: v }); }} />
            </Row>
            <Row cols={2}>
              <ColorField label="Tło całej strony" value={form.page_bg || '#f6f8fb'} onChange={(v) => update('page_bg', v)} />
              <ColorField label="Tło nagłówka" value={form.header_bg || '#ffffff'} onChange={(v, live) => { update('header_bg', v); if (live) applyBrandToHtml({ ...form, header_bg: v }); }} />
            </Row>
          </Accordion>

          <Accordion title="Karty – Grid (kafelki)">
            <CardPropertiesForm design={gridDesign} onUpdate={(patch) => setDesign('grid', patch)} />
          </Accordion>

          <Accordion title="Karty – Lista (wiersze)">
            <CardPropertiesForm design={listDesign} onUpdate={(patch) => setDesign('list', patch)} />
          </Accordion>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? 'Zapisywanie…' : 'Zapisz i zastosuj'}
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50" onClick={handleExport}>
              <Download className="h-4 w-4" /> Eksport (JSON)
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">
              <Upload className="h-4 w-4" /> Import (JSON)
              <input type="file" accept="application/json" className="hidden" onChange={(e) => handleImport(e.target.files?.[0] || undefined)} />
            </label>
            <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-red-700 hover:bg-red-50" onClick={handleReset}>
              <RefreshCcw className="h-4 w-4" /> Przywróć domyślne
            </button>
          </div>
        </div>

        <div className="col-span-12 space-y-6 xl:col-span-5">
          {/* Presety */}
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <SectionHeader
              title="Presety"
              right={
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs hover:bg-gray-50" onClick={saveAsPreset}>
                  <Plus className="h-3.5 w-3.5" /> Zapisz jako preset
                </button>
              }
            />
            <div className="p-4 space-y-4">
              <div>
                <div className="mb-1 text-xs font-medium text-gray-500">Moje presety</div>
                {Object.keys(userPresets).length ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {Object.keys(userPresets).map((name) => (
                      <div key={`user-${name}`} className="inline-flex items-center gap-1.5">
                        <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs hover:bg-gray-50" onClick={() => applyUserPreset(name)}>
                          {name}
                        </button>
                        <button className="rounded-md p-1 text-red-700 hover:bg-red-50" title="Usuń" onClick={() => deletePreset(name)}>
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">Brak – zapisz pierwszy preset przyciskiem powyżej.</div>
                )}
              </div>
            </div>
          </div>

          {/* Podglądy */}
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <SectionHeader title="Podgląd – Grid" />
            <div ref={previewRef} className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => <GridPreviewCard key={`g-${i}`} i={i} design={gridDesign} />)}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <SectionHeader title="Podgląd – Lista" />
            <div className="p-4">
              <div className="space-y-4">
                {[0, 1, 2].map((i) => <ListPreviewCard key={`l-${i}`} i={i} design={listDesign} />)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* interakcje fav */}
      <style>{`
        .brand-fav-btn[data-scope="grid"]{ background: var(--lc-grid-fav-bg); color: var(--lc-grid-fav-color); }
        .brand-fav-btn[data-scope="grid"]:hover{ background: var(--lc-grid-fav-bg-hover); color: var(--lc-grid-fav-color-hover); }
        .brand-fav-btn[data-scope="grid"]:active{ background: var(--lc-grid-fav-bg-active); color: var(--lc-grid-fav-color-active); }
        .brand-fav-btn[data-scope="list"]{ background: var(--lc-list-fav-bg); color: var(--lc-list-fav-color); }
        .brand-fav-btn[data-scope="list"]:hover{ background: var(--lc-list-fav-bg-hover); color: var(--lc-list-fav-color-hover); }
        .brand-fav-btn[data-scope="list"]:active{ background: var(--lc-list-fav-bg-active); color: var(--lc-list-fav-color-active); }
      `}</style>
    </div>
  );
}

/* ====================== ColorField z LIVE podglądem ====================== */

function ColorField({
  label, value, onChange, id,
}: {
  label: string;
  value: string;
  onChange: (rgba: string, live?: boolean) => void;
  id?: string;
}) {
  const hex = rgbOrHexToHex(value || '#ffffff');
  const alphaMatch = value?.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/i);
  const alpha = alphaMatch ? Math.round(Number(alphaMatch[1]) * 100) : 100;

  const emit = (newHex: string, newAlpha: number, live?: boolean) =>
    onChange(rgba(newHex, newAlpha / 100), live);

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex items-center gap-3">
        <input
          type="color"
          id={id}
          className="h-10 w-14 cursor-pointer rounded border"
          value={hex}
          onChange={(e) => emit(e.target.value, alpha, true)}
          onInput={(e) => emit((e.target as HTMLInputElement).value, alpha, true)}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={alpha}
          onChange={(e) => emit(hex, Number(e.target.value), true)}
          onInput={(e) => emit(hex, Number((e.target as HTMLInputElement).value), true)}
          className="w-full"
        />
        <div className="w-10 text-right text-xs text-gray-600">{alpha}%</div>
      </div>
    </div>
  );
}

function CardPropertiesForm({
  design, onUpdate,
}: { design: Partial<ListingCardBlock>; onUpdate: (patch: Partial<ListingCardBlock>) => void; }) {
  const d: any = design;
  return (
    <div className="space-y-3">
      {/* … (identycznie jak wcześniej, bez zmian w logice) … */}
      {/* DLA ZWIĘZŁOŚCI: Wklej tu swój dotychczasowy blok pól karty 1:1 */}
    </div>
  );
}
