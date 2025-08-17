'use client';

import * as React from 'react';
import {
  BRAND_PRESETS,
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
import { Camera, MapPin, Upload, Download, Save, RefreshCcw, Plus, Trash, ChevronDown, ChevronRight } from 'lucide-react';
import { adminApi } from '@/lib/adminApi';

/* =========================================================
   U T I L S
========================================================= */

const PREVIEW_IMGS = [
  'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1400&q=80',
];

type PartialBrand = Partial<BrandPayload>;

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(' ');
}

/** localStorage – custom presety */
const PRESETS_KEY = 'houser.brand.userpresets';
function loadUserPresets(): Record<string, PartialBrand> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PartialBrand>) : {};
  } catch {
    return {};
  }
}
function saveUserPresets(data: Record<string, PartialBrand>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(data));
  } catch {}
}

/** RGBA <-> UI */
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
  const r = Number(m[1]),
    g = Number(m[2]),
    b = Number(m[3]);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function rgbaString(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex || '#000000');
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/* =========================================================
   M A Ł E   K O M P O N E N T Y
========================================================= */

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

function TextField({
  label,
  value,
  onChange,
  placeholder,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
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

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
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

function SelectField({
  label,
  value,
  onChange,
  options,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  id?: string;
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
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function RangeField({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = 'px',
}: {
  id?: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block space-y-1" htmlFor={id}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-gray-800">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="w-full"
        min={min}
        max={max}
        step={step ?? 1}
        value={Number(value ?? 0)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

/** Kolor + alfa – BEZ wywoływania onChange w useEffect */
function ColorField({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: string;
  onChange: (rgba: string) => void;
  id?: string;
}) {
  const [hex, setHex] = React.useState(rgbOrHexToHex(value || '#ffffff'));
  const [alpha, setAlpha] = React.useState(() => {
    const m = value?.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/i);
    return m ? Math.round(Number(m[1]) * 100) : 100;
  });

  // Sync zewnętrznej wartości -> lokalny stan (bez onChange)
  React.useEffect(() => {
    setHex(rgbOrHexToHex(value || '#ffffff'));
    const m = value?.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/i);
    setAlpha(m ? Math.round(Number(m[1]) * 100) : 100);
  }, [value]);

  const emit = React.useCallback(
    (h: string, a: number) => onChange(rgbaString(h, a / 100)),
    [onChange]
  );

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex items-center gap-3">
        <input
          type="color"
          id={id}
          className="h-10 w-14 cursor-pointer rounded border"
          value={hex}
          onChange={(e) => {
            const nv = e.target.value;
            setHex(nv);
            emit(nv, alpha);
          }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={alpha}
          onChange={(e) => {
            const na = Number(e.target.value);
            setAlpha(na);
            emit(hex, na);
          }}
          className="w-full"
        />
        <div className="w-10 text-right text-xs text-gray-600">{alpha}%</div>
      </div>
    </div>
  );
}

/** mały akordeon */
function Accordion({
  title,
  defaultOpen = false,
  children,
  right,
}: {
  title: string;
  defaultOpen?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 opacity-70" /> : <ChevronRight className="h-4 w-4 opacity-70" />}
          <span className="font-semibold">{title}</span>
        </div>
        {right}
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

/* =========================================================
   P R E V I E W   K A R T Y
========================================================= */

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

function GridPreviewCard({ i }: { i: number }) {
  const img = PREVIEW_IMGS[i % PREVIEW_IMGS.length];
  const P = '--lc-grid';

  return (
    <div
      className="group overflow-hidden transition"
      style={{
        borderRadius: `var(${P}-radius)`,
        background: `var(${P}-bg)`,
        boxShadow: `var(${P}-shadow)`,
      }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: `var(${P}-img-aspect)` as any }}>
        <img src={img} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        <div className="absolute left-0 right-0 top-2 flex px-2" style={{ justifyContent: `var(${P}-chip-justify)` as any }}>
          <Chip scope="grid" text="Sprzedaż" />
        </div>
        <div
          className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]"
          style={{ background: `var(${P}-imgcount-bg)`, color: `var(${P}-imgcount-color)` }}
        >
          <Camera className="h-[14px] w-[14px]" />
          <span>7</span>
        </div>
      </div>

      <div className="p-3">
        <div
          className="line-clamp-2 text-gray-900"
          style={{
            marginBottom: `var(${P}-title-mb)`,
            fontWeight: `var(${P}-title-weight)` as any,
            fontSize: `var(${P}-title-size)`,
            textAlign: `var(${P}-title-align)` as any,
          }}
        >
          Dwupokojowe mieszkanie na nowym osiedlu
        </div>

        <div
          className="inline-flex items-center gap-1 text-gray-600"
          style={{
            marginTop: `var(${P}-address-mt)`,
            fontSize: `var(${P}-address-size)`,
            fontWeight: `var(${P}-address-weight)` as any,
          }}
        >
          <MapPin className="h-3.5 w-3.5 opacity-70" />
          <span>Poznań, Rataje</span>
        </div>

        <div className="flex items-center" style={{ justifyContent: `var(${P}-price-justify)` as any, marginTop: `var(${P}-price-mt)` }}>
          <PriceBadge scope="grid">749 000 zł</PriceBadge>
        </div>

        <div className="mt-2 flex gap-2" style={{ justifyContent: `var(${P}-meta-justify)` as any, marginTop: `var(${P}-meta-mt)` }}>
          <MetaPill scope="grid">52 m²</MetaPill>
          <MetaPill scope="grid">14 400 zł/m²</MetaPill>
        </div>
      </div>
    </div>
  );
}

function ListPreviewCard({ i }: { i: number }) {
  const img = PREVIEW_IMGS[i % PREVIEW_IMGS.length];
  const P = '--lc-list';

  return (
    <div
      className="grid grid-cols-[180px_1fr] gap-3 overflow-hidden transition"
      style={{
        borderRadius: `var(${P}-radius)`,
        background: `var(${P}-bg)`,
        boxShadow: `var(${P}-shadow)`,
      }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: `var(${P}-img-aspect)` as any }}>
        <img src={img} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        <div className="absolute left-0 right-0 top-2 flex px-2" style={{ justifyContent: `var(${P}-chip-justify)` as any }}>
          <Chip scope="list" text="Wynajem" />
        </div>
        <div
          className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]"
          style={{ background: `var(${P}-imgcount-bg)`, color: `var(${P}-imgcount-color)` }}
        >
          <Camera className="h-[14px] w-[14px]" />
          <span>12</span>
        </div>
      </div>

      <div className="p-3">
        <div
          className="line-clamp-2 text-gray-900"
          style={{
            marginBottom: `var(${P}-title-mb)`,
            fontWeight: `var(${P}-title-weight)` as any,
            fontSize: `var(${P}-title-size)`,
            textAlign: `var(${P}-title-align)` as any,
          }}
        >
          Przytulne 2 pokoje, wysoki standard
        </div>

        <div
          className="inline-flex items-center gap-1 text-gray-600"
          style={{
            marginTop: `var(${P}-address-mt)`,
            fontSize: `var(${P}-address-size)`,
            fontWeight: `var(${P}-address-weight)` as any,
          }}
        >
          <MapPin className="h-3.5 w-3.5 opacity-70" />
          <span>Warszawa, Mokotów</span>
        </div>

        <div className="flex items-center" style={{ justifyContent: `var(${P}-price-justify)` as any, marginTop: `var(${P}-price-mt)` }}>
          <PriceBadge scope="list">3 200 zł / m-c</PriceBadge>
        </div>

        <div className="mt-2 flex gap-2" style={{ justifyContent: `var(${P}-meta-justify)` as any, marginTop: `var(${P}-meta-mt)` }}>
          <MetaPill scope="list">64 m²</MetaPill>
          <MetaPill scope="list">50 zł/m²</MetaPill>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   S T R O N A
========================================================= */

export default function AdminBrandingPage() {
  const previewRef = React.useRef<HTMLDivElement | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // form – pełny brand (z normalizacją)
  const [form, setForm] = React.useState<BrandPayload>(() =>
    normalizeBrand(deepMerge(DEFAULT_BRAND, loadBrandFromLocalStorage() || {}))
  );

  // presety – wbudowane + użytkownika
  const [userPresets, setUserPresets] = React.useState<Record<string, PartialBrand>>({});

  React.useEffect(() => {
    setUserPresets(loadUserPresets());
  }, []);

  // live preview – tylko na kontenerze (nie modyfikuje całej strony admina)
  React.useEffect(() => {
    if (!previewRef.current) return;
    applyBrandToElement(previewRef.current, form);
  }, [form]);

  // handlery
  const update = React.useCallback(<K extends keyof BrandPayload>(k: K, v: BrandPayload[K]) => {
    setForm((s) => {
      // wczesny bail-out dla prostych typów
      if (typeof v !== 'object' && s[k] === v) return s;
      return normalizeBrand({ ...s, [k]: v });
    });
  }, []);

  const setDesign = React.useCallback((scope: 'grid' | 'list', patch: Partial<ListingCardBlock>) => {
    setForm((s) => {
      const cur = (s.listing_card?.[scope] || {}) as Record<string, any>;
      let changed = false;
      for (const k of Object.keys(patch)) {
        if (cur[k] !== (patch as any)[k]) {
          changed = true;
          break;
        }
      }
      if (!changed) return s;
      const next: BrandPayload = normalizeBrand({
        ...s,
        listing_card: {
          ...(s.listing_card || {}),
          [scope]: { ...cur, ...patch },
        },
      });
      return next;
    });
  }, []);

  const applyPreset = (name: string) => {
    const builtIn = BRAND_PRESETS[name];
    const custom = userPresets[name];
    const preset = builtIn || custom;
    if (!preset) return;
    setForm((s) => normalizeBrand(deepMerge(s, preset)));
    setMsg(`Zastosowano preset: ${name}`);
  };

  const saveAsPreset = () => {
    const name = window.prompt('Nazwa nowego presetu (np. „Modern Lime”)');
    if (!name) return;
    const current = { ...form };
    const all = { ...loadUserPresets(), [name]: current };
    saveUserPresets(all);
    setUserPresets(all);
    setMsg(`Zapisano preset „${name}”`);
  };

  const deletePreset = (name: string) => {
    const all = { ...loadUserPresets() };
    delete all[name];
    saveUserPresets(all);
    setUserPresets(all);
    setMsg(`Usunięto preset „${name}”`);
  };

  const handleExport = () => {
    const data = JSON.stringify(form, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setForm(normalizeBrand(json));
      setMsg('Zaimportowano ustawienia z pliku JSON.');
    } catch (e) {
      setErr('Nie udało się zaimportować pliku JSON.');
    }
  };

  const handleReset = () => {
    const next = normalizeBrand(DEFAULT_BRAND);
    setForm(next);
    setMsg('Przywrócono ustawienia domyślne.');
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      try {
        await adminApi.saveBrand?.(form);
      } catch {
        /* pomijamy backend – LS i tak zadziała */
      }
      saveBrandToLocalStorage(form);
      applyBrandToHtml(form);
      notifyBrandUpdated();
      setMsg('Zapisano i zastosowano na froncie 🎉');
    } catch (e: any) {
      setErr(e?.message || 'Błąd zapisu.');
    } finally {
      setSaving(false);
    }
  };

  // upload logo
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const handlePickLogo = async (f?: File) => {
  if (!f) return;
  try {
    setSaving(true);
    setMsg(null);
    setErr(null);
    let newUrl = '';
    try {
      // jeśli masz backend – super, używamy stałego URL-a
      const res = await adminApi.uploadLogo?.(f);
      newUrl = (res && (res.url || res.logo_url)) || '';
    } catch {
      // FALLBACK: data URL zamiast blob/URL.createObjectURL (to się nie kasuje po reloadzie)
      newUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(f);
      });
    }
    update('logo_url', String(newUrl));
  } catch (e: any) {
    setErr(e?.message || 'Nie udało się wgrać logo.');
  } finally {
    setSaving(false);
  }
};

  /* ========================= R E N D E R ========================= */

  const builtinPresetNames = Object.keys(BRAND_PRESETS);
  const userPresetNames = Object.keys(userPresets);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Branding</h1>
        <p className="text-gray-600">Kolory, logo, SEO i wygląd kart (Grid / Lista).</p>
      </div>

      {/* TOASTY */}
      <div className="mb-4 space-y-2">
        {msg && <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{msg}</div>}
        {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEWA KOLUMNA: Formularze */}
        <div className="col-span-12 space-y-6 xl:col-span-7">
          {/* Tożsamość i SEO */}
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
                  {form.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.logo_url} alt="logo" className="h-full w-full object-contain" />
                  ) : (
                    <div className="text-xs text-gray-500">Brak</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" /> Wybierz z dysku
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/webp,.svg"
                    className="hidden"
                    onChange={(e) => handlePickLogo(e.target.files?.[0] || undefined)}
                  />
                  {form.logo_url && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                      onClick={() => update('logo_url', '')}
                    >
                      <Trash className="h-4 w-4" /> Usuń logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Accordion>

          {/* Kolory i tła strony (global) */}
          <Accordion title="Kolory i tła strony (global)">
            <Row cols={3}>
              <ColorField label="Kolor wiodący (primary)" value={form.primary_color || '#2563eb'} onChange={(v) => update('primary_color', v)} />
              <ColorField label="Kolor dodatkowy (secondary)" value={form.secondary_color || '#f97316'} onChange={(v) => update('secondary_color', v)} />
              <ColorField label="Kolor tekstu" value={form.text_color || '#0f172a'} onChange={(v) => update('text_color', v)} />
            </Row>
            <Row cols={2}>
              <ColorField label="Tło całej strony" value={form.page_bg || '#f6f8fb'} onChange={(v) => update('page_bg', v)} />
              <ColorField label="Tło nagłówka" value={form.header_bg || '#ffffff'} onChange={(v) => update('header_bg', v)} />
            </Row>
            <Row cols={1}>
              <RangeField id="btn-radius" label="Przyciski – promień zaokrąglenia" min={0} max={30} value={form.button_radius ?? 14} onChange={(n) => update('button_radius', n)} />
            </Row>
          </Accordion>

          {/* GRID – pełne opcje */}
          <Accordion title="Karty – Grid (kafelki)">
            <Row cols={2}>
              <ColorField label="Tło karty" value={form.listing_card?.grid?.cardBg || '#ffffff'} onChange={(v) => setDesign('grid', { cardBg: v })} />
              <TextField
                label="Cień (CSS box-shadow)"
                value={form.listing_card?.grid?.shadow || '0 2px 8px rgba(2,6,23,.06), 0 14px 34px rgba(2,6,23,.06)'}
                onChange={(v) => setDesign('grid', { shadow: v as any })}
              />
            </Row>
            <Row cols={3}>
              <RangeField id="g-radius" label="Zaokrąglenie (px)" min={0} max={28} value={form.listing_card?.grid?.cardRadius ?? 14} onChange={(n) => setDesign('grid', { cardRadius: n })} />
              <RangeField id="g-px" label="Padding X (px)" min={0} max={20} value={form.listing_card?.grid?.cardPx ?? 0} onChange={(n) => setDesign('grid', { cardPx: n })} />
              <RangeField id="g-py" label="Padding Y (px)" min={0} max={20} value={form.listing_card?.grid?.cardPy ?? 0} onChange={(n) => setDesign('grid', { cardPy: n })} />
            </Row>
            <Row cols={2}>
              <TextField label="Proporcje obrazu (aspect-ratio)" value={form.listing_card?.grid?.imgAspect || '16 / 9'} onChange={(v) => setDesign('grid', { imgAspect: v })} />
            </Row>

            <div className="mt-4 rounded-xl border p-4">
              <div className="mb-2 font-medium">Tytuł</div>
              <Row cols={4}>
                <RangeField id="g-title-size" label="Rozmiar (px)" min={12} max={24} value={form.listing_card?.grid?.titleSize ?? 16} onChange={(n) => setDesign('grid', { titleSize: n })} />
                <RangeField id="g-title-weight" label="Grubość" min={300} max={900} step={50} value={form.listing_card?.grid?.titleWeight ?? 700} onChange={(n) => setDesign('grid', { titleWeight: n })} />
                <SelectField
                  label="Wyrównanie"
                  value={form.listing_card?.grid?.titleAlign ?? 'left'}
                  onChange={(v) => setDesign('grid', { titleAlign: v as any })}
                  options={[
                    ['left', 'Lewo'],
                    ['center', 'Środek'],
                    ['right', 'Prawo'],
                  ]}
                />
                <RangeField id="g-title-mb" label="Margines dół (px)" min={0} max={20} value={form.listing_card?.grid?.titleMb ?? 0} onChange={(n) => setDesign('grid', { titleMb: n })} />
              </Row>
            </div>

            <div className="mt-4 rounded-xl border p-4">
              <div className="mb-2 font-medium">Adres</div>
              <Row cols={3}>
                <RangeField id="g-addr-size" label="Rozmiar (px)" min={10} max={18} value={form.listing_card?.grid?.addressSize ?? 12} onChange={(n) => setDesign('grid', { addressSize: n })} />
                <RangeField id="g-addr-weight" label="Grubość" min={300} max={800} step={50} value={form.listing_card?.grid?.addressWeight ?? 400} onChange={(n) => setDesign('grid', { addressWeight: n })} />
                <RangeField id="g-addr-mt" label="Margines top (px)" min={0} max={20} value={form.listing_card?.grid?.addressMt ?? 4} onChange={(n) => setDesign('grid', { addressMt: n })} />
              </Row>
            </div>

            <div className="mt-4 rounded-xl border p-4">
              <div className="mb-2 font-medium">Cena</div>
              <Row cols={4}>
                <ColorField label="Tło" value={form.listing_card?.grid?.priceBg || '#ffb800'} onChange={(v) => setDesign('grid', { priceBg: v })} />
                <ColorField label="Tekst" value={form.listing_card?.grid?.priceColor || '#111827'} onChange={(v) => setDesign('grid', { priceColor: v })} />
                <RangeField id="g-price-size" label="Rozmiar (px)" min={10} max={20} value={form.listing_card?.grid?.priceSize ?? 14} onChange={(n) => setDesign('grid', { priceSize: n })} />
                <RangeField id="g-price-weight" label="Grubość" min={300} max={900} step={50} value={form.listing_card?.grid?.priceWeight ?? 600} onChange={(n) => setDesign('grid', { priceWeight: n })} />
              </Row>
              <Row cols={4}>
                <RangeField id="g-price-px" label="Pad X (px)" min={4} max={24} value={form.listing_card?.grid?.pricePx ?? 10} onChange={(n) => setDesign('grid', { pricePx: n })} />
                <RangeField id="g-price-py" label="Pad Y (px)" min={2} max={16} value={form.listing_card?.grid?.pricePy ?? 6} onChange={(n) => setDesign('grid', { pricePy: n })} />
                <SelectField
                  label="Pozycja"
                  value={form.listing_card?.grid?.priceJustify ?? 'left'}
                  onChange={(v) => setDesign('grid', { priceJustify: v as any })}
                  options={[
                    ['left', 'Lewo'],
                    ['center', 'Środek'],
                    ['right', 'Prawo'],
                  ]}
                />
                <RangeField id="g-price-mt" label="Margines top (px)" min={0} max={24} value={form.listing_card?.grid?.priceMt ?? 8} onChange={(n) => setDesign('grid', { priceMt: n })} />
              </Row>
            </div>

            <div className="mt-4 rounded-xl border p-4">
              <div className="mb-2 font-medium">Chip kategorii</div>
              <Row cols={2}>
                <ColorField label="Tło" value={form.listing_card?.grid?.chipBg || 'rgba(0,0,0,.65)'} onChange={(v) => setDesign('grid', { chipBg: v })} />
                <ColorField label="Tekst" value={form.listing_card?.grid?.chipColor || '#fff'} onChange={(v) => setDesign('grid', { chipColor: v })} />
              </Row>
              <Row cols={4}>
                <RangeField id="g-chip-fs" label="Font (px)" min={10} max={18} value={form.listing_card?.grid?.chipFont ?? 12} onChange={(n) => setDesign('grid', { chipFont: n })} />
                <RangeField id="g-chip-px" label="Pad X (px)" min={4} max={24} value={form.listing_card?.grid?.chipPx ?? 10} onChange={(n) => setDesign('grid', { chipPx: n })} />
                <RangeField id="g-chip-py" label="Pad Y (px)" min={0} max={12} value={form.listing_card?.grid?.chipPy ?? 4} onChange={(n) => setDesign('grid', { chipPy: n })} />
                <RangeField id="g-chip-radius" label="Radius (px)" min={0} max={32} value={form.listing_card?.grid?.chipRadius ?? 999} onChange={(n) => setDesign('grid', { chipRadius: n })} />
              </Row>
              <Row cols={2}>
                <SelectField
                  label="Pozycja"
                  value={form.listing_card?.grid?.chipJustify ?? 'left'}
                  onChange={(v) => setDesign('grid', { chipJustify: v as any })}
                  options={[
                    ['left', 'Lewo'],
                    ['center', 'Środek'],
                    ['right', 'Prawo'],
                  ]}
                />
              </Row>
            </div>

            <div className="mt-4 rounded-xl border p-4">
              <div className="mb-2 font-medium">Licznik zdjęć</div>
              <Row cols={2}>
                <ColorField label="Tło" value={form.listing_card?.grid?.imgCounterBg || 'rgba(0,0,0,.55)'} onChange={(v) => setDesign('grid', { imgCounterBg: v })} />
                <ColorField label="Tekst" value={form.listing_card?.grid?.imgCounterColor || '#fff'} onChange={(v) => setDesign('grid', { imgCounterColor: v })} />
              </Row>
            </div>

            <div className="mt-4 rounded-xl border p-4">
              <div className="mb-2 font-medium">Meta (powierzchnia / zł/m²)</div>
              <Row cols={2}>
                <ColorField label="Tło" value={form.listing_card?.grid?.metaBg || 'rgba(17,24,39,.06)'} onChange={(v) => setDesign('grid', { metaBg: v })} />
                <ColorField label="Tekst" value={form.listing_card?.grid?.metaColor || '#111827'} onChange={(v) => setDesign('grid', { metaColor: v })} />
              </Row>
              <Row cols={4}>
                <RangeField id="g-meta-fs" label="Font (px)" min={10} max={16} value={form.listing_card?.grid?.metaFont ?? 12} onChange={(n) => setDesign('grid', { metaFont: n })} />
                <RangeField id="g-meta-px" label="Pad X (px)" min={4} max={20} value={form.listing_card?.grid?.metaPx ?? 10} onChange={(n) => setDesign('grid', { metaPx: n })} />
                <RangeField id="g-meta-py" label="Pad Y (px)" min={0} max={14} value={form.listing_card?.grid?.metaPy ?? 6} onChange={(n) => setDesign('grid', { metaPy: n })} />
                <RangeField id="g-meta-radius" label="Radius (px)" min={0} max={24} value={form.listing_card?.grid?.metaRadius ?? 10} onChange={(n) => setDesign('grid', { metaRadius: n })} />
              </Row>
              <Row cols={2}>
                <SelectField
                  label="Pozycja"
                  value={form.listing_card?.grid?.metaJustify ?? 'left'}
                  onChange={(v) => setDesign('grid', { metaJustify: v as any })}
                  options={[
                    ['left', 'Lewo'],
                    ['center', 'Środek'],
                    ['right', 'Prawo'],
                  ]}
                />
                <RangeField id="g-meta-mt" label="Margines top (px)" min={0} max={28} value={form.listing_card?.grid?.metaMt ?? 10} onChange={(n) => setDesign('grid', { metaMt: n })} />
              </Row>
            </div>
          </Accordion>

          {/* LIST – pełne opcje */}
          <Accordion title="Karty – Lista (w wierszach)">
            <Row cols={2}>
              <ColorField label="Tło karty" value={form.listing_card?.list?.cardBg || '#ffffff'} onChange={(v) => setDesign('list', { cardBg: v })} />
              <TextField
                label="Cień (CSS box-shadow)"
                value={form.listing_card?.list?.shadow || '0 2px 8px rgba(2,6,23,.06), 0 14px 34px rgba(2,6,23,.06)'}
                onChange={(v) => setDesign('list', { shadow: v as any })}
              />
            </Row>
            <Row cols={3}>
              <RangeField id="l-radius" label="Zaokrąglenie (px)" min={0} max={28} value={form.listing_card?.list?.cardRadius ?? 14} onChange={(n) => setDesign('list', { cardRadius: n })} />
              <RangeField id="l-px" label="Padding X (px)" min={0} max={20} value={form.listing_card?.list?.cardPx ?? 0} onChange={(n) => setDesign('list', { cardPx: n })} />
              <RangeField id="l-py" label="Padding Y (px)" min={0} max={20} value={form.listing_card?.list?.cardPy ?? 0} onChange={(n) => setDesign('list', { cardPy: n })} />
            </Row>
            <Row cols={2}>
              <TextField label="Proporcje obrazu (aspect-ratio)" value={form.listing_card?.list?.imgAspect || '21 / 9'} onChange={(v) => setDesign('list', { imgAspect: v })} />
            </Row>

            <div className="mt-4 rounded-xl border p-4">
              <div className="mb-2 font-medium">Tytuł</div>
              <Row cols={4}>
                <RangeField id="l-title-size" label="Rozmiar (px)" min={12} max={26} value={form.listing_card?.list?.titleSize ?? 16} onChange={(n) => setDesign('list', { titleSize: n })} />
                <RangeField id="l-title-weight" label="Grubość" min={300} max={900} step={50} value={form.listing_card?.list?.titleWeight ?? 700} onChange={(n) => setDesign('list', { titleWeight: n })} />
                <SelectField
                  label="Wyrównanie"
                  value={form.listing_card?.list?.titleAlign ?? 'left'}
                  onChange={(v) => setDesign('list', { titleAlign: v as any })}
                  options={[
                    ['left', 'Lewo'],
                    ['center', 'Środek'],
                    ['right', 'Prawo'],
                  ]}
                />
                <RangeField id="l-title-mb" label="Margines dół (px)" min={0} max={20} value={form.listing_card?.list?.titleMb ?? 0} onChange={(n) => setDesign('list', { titleMb: n })} />
              </Row>
            </div>

            <div className="mt-4 rounded-xl border p-4">
              <div className="mb-2 font-medium">Adres</div>
              <Row cols={3}>
                <RangeField id="l-addr-size" label="Rozmiar (px)" min={10} max={18} value={form.listing_card?.list?.addressSize ?? 12} onChange={(n) => setDesign('list', { addressSize: n })} />
                <RangeField id="l-addr-weight" label="Grubość" min={300} max={800} step={50} value={form.listing_card?.list?.addressWeight ?? 400} onChange={(n) => setDesign('list', { addressWeight: n })} />
                <RangeField id="l-addr-mt" label="Margines top (px)" min={0} max={20} value={form.listing_card?.list?.addressMt ?? 4} onChange={(n) => setDesign('list', { addressMt: n })} />
              </Row>
            </div>

            <div className="mt-4 rounded-xl border p-4">
              <div className="mb-2 font-medium">Cena</div>
              <Row cols={4}>
                <ColorField label="Tło" value={form.listing_card?.list?.priceBg || '#ffb800'} onChange={(v) => setDesign('list', { priceBg: v })} />
                <ColorField label="Tekst" value={form.listing_card?.list?.priceColor || '#111827'} onChange={(v) => setDesign('list', { priceColor: v })} />
                <RangeField id="l-price-size" label="Rozmiar (px)" min={10} max={20} value={form.listing_card?.list?.priceSize ?? 14} onChange={(n) => setDesign('list', { priceSize: n })} />
                <RangeField id="l-price-weight" label="Grubość" min={300} max={900} step={50} value={form.listing_card?.list?.priceWeight ?? 600} onChange={(n) => setDesign('list', { priceWeight: n })} />
              </Row>
              <Row cols={4}>
                <RangeField id="l-price-px" label="Pad X (px)" min={4} max={24} value={form.listing_card?.list?.pricePx ?? 10} onChange={(n) => setDesign('list', { pricePx: n })} />
                <RangeField id="l-price-py" label="Pad Y (px)" min={2} max={16} value={form.listing_card?.list?.pricePy ?? 6} onChange={(n) => setDesign('list', { pricePy: n })} />
                <SelectField
                  label="Pozycja"
                  value={form.listing_card?.list?.priceJustify ?? 'left'}
                  onChange={(v) => setDesign('list', { priceJustify: v as any })}
                  options={[
                    ['left', 'Lewo'],
                    ['center', 'Środek'],
                    ['right', 'Prawo'],
                  ]}
                />
                <RangeField id="l-price-mt" label="Margines top (px)" min={0} max={24} value={form.listing_card?.list?.priceMt ?? 8} onChange={(n) => setDesign('list', { priceMt: n })} />
              </Row>
            </div>

            <div className="mt-4 rounded-xl border p-4">
              <div className="mb-2 font-medium">Chip kategorii</div>
              <Row cols={2}>
                <ColorField label="Tło" value={form.listing_card?.list?.chipBg || 'rgba(0,0,0,.65)'} onChange={(v) => setDesign('list', { chipBg: v })} />
                <ColorField label="Tekst" value={form.listing_card?.list?.chipColor || '#fff'} onChange={(v) => setDesign('list', { chipColor: v })} />
              </Row>
              <Row cols={4}>
                <RangeField id="l-chip-fs" label="Font (px)" min={10} max={18} value={form.listing_card?.list?.chipFont ?? 12} onChange={(n) => setDesign('list', { chipFont: n })} />
                <RangeField id="l-chip-px" label="Pad X (px)" min={4} max={24} value={form.listing_card?.list?.chipPx ?? 10} onChange={(n) => setDesign('list', { chipPx: n })} />
                <RangeField id="l-chip-py" label="Pad Y (px)" min={0} max={12} value={form.listing_card?.list?.chipPy ?? 4} onChange={(n) => setDesign('list', { chipPy: n })} />
                <RangeField id="l-chip-radius" label="Radius (px)" min={0} max={32} value={form.listing_card?.list?.chipRadius ?? 999} onChange={(n) => setDesign('list', { chipRadius: n })} />
              </Row>
              <Row cols={2}>
                <SelectField
                  label="Pozycja"
                  value={form.listing_card?.list?.chipJustify ?? 'left'}
                  onChange={(v) => setDesign('list', { chipJustify: v as any })}
                  options={[
                    ['left', 'Lewo'],
                    ['center', 'Środek'],
                    ['right', 'Prawo'],
                  ]}
                />
              </Row>
            </div>

            <div className="mt-4 rounded-xl border p-4">
              <div className="mb-2 font-medium">Licznik zdjęć</div>
              <Row cols={2}>
                <ColorField label="Tło" value={form.listing_card?.list?.imgCounterBg || 'rgba(0,0,0,.55)'} onChange={(v) => setDesign('list', { imgCounterBg: v })} />
                <ColorField label="Tekst" value={form.listing_card?.list?.imgCounterColor || '#fff'} onChange={(v) => setDesign('list', { imgCounterColor: v })} />
              </Row>
            </div>

            <div className="mt-4 rounded-xl border p-4">
              <div className="mb-2 font-medium">Meta (powierzchnia / zł/m²)</div>
              <Row cols={2}>
                <ColorField label="Tło" value={form.listing_card?.list?.metaBg || 'rgba(17,24,39,.06)'} onChange={(v) => setDesign('list', { metaBg: v })} />
                <ColorField label="Tekst" value={form.listing_card?.list?.metaColor || '#111827'} onChange={(v) => setDesign('list', { metaColor: v })} />
              </Row>
              <Row cols={4}>
                <RangeField id="l-meta-fs" label="Font (px)" min={10} max={16} value={form.listing_card?.list?.metaFont ?? 12} onChange={(n) => setDesign('list', { metaFont: n })} />
                <RangeField id="l-meta-px" label="Pad X (px)" min={4} max={20} value={form.listing_card?.list?.metaPx ?? 10} onChange={(n) => setDesign('list', { metaPx: n })} />
                <RangeField id="l-meta-py" label="Pad Y (px)" min={0} max={14} value={form.listing_card?.list?.metaPy ?? 6} onChange={(n) => setDesign('list', { metaPy: n })} />
                <RangeField id="l-meta-radius" label="Radius (px)" min={0} max={24} value={form.listing_card?.list?.metaRadius ?? 10} onChange={(n) => setDesign('list', { metaRadius: n })} />
              </Row>
              <Row cols={2}>
                <SelectField
                  label="Pozycja"
                  value={form.listing_card?.list?.metaJustify ?? 'left'}
                  onChange={(v) => setDesign('list', { metaJustify: v as any })}
                  options={[
                    ['left', 'Lewo'],
                    ['center', 'Środek'],
                    ['right', 'Prawo'],
                  ]}
                />
                <RangeField id="l-meta-mt" label="Margines top (px)" min={0} max={28} value={form.listing_card?.list?.metaMt ?? 10} onChange={(n) => setDesign('list', { metaMt: n })} />
              </Row>
            </div>
          </Accordion>

          {/* Zapis */}
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? 'Zapisywanie…' : 'Zapisz i zastosuj'}
            </button>

            <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Eksport (JSON)
            </button>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">
              <Upload className="h-4 w-4" />
              Import (JSON)
              <input type="file" accept="application/json" className="hidden" onChange={(e) => handleImport(e.target.files?.[0] || undefined)} />
            </label>

            <button
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-red-700 hover:bg-red-50"
              onClick={handleReset}
            >
              <RefreshCcw className="h-4 w-4" />
              Przywróć domyślne
            </button>
          </div>
        </div>

        {/* PRAWA KOLUMNA: Presety + podgląd */}
        <div className="col-span-12 space-y-6 xl:col-span-5">
          {/* Presety */}
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <SectionHeader
              title="Presety"
              right={
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs hover:bg-gray-50"
                    onClick={saveAsPreset}
                  >
                    <Plus className="h-3.5 w-3.5" /> Zapisz jako preset
                  </button>
                </div>
              }
            />
            <div className="p-4 space-y-4">
              <div>
                <div className="mb-1 text-xs font-medium text-gray-500">Wbudowane</div>
                <div className="flex flex-wrap gap-2">
                  {builtinPresetNames.map((name) => (
                    <button
                      key={`builtin-${name}`}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs hover:bg-gray-50"
                      onClick={() => applyPreset(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs font-medium text-gray-500">Moje presety</div>
                {userPresetNames.length ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {userPresetNames.map((name) => (
                      <div key={`user-${name}`} className="inline-flex items-center gap-1.5">
                        <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs hover:bg-gray-50" onClick={() => applyPreset(name)}>
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

          {/* Podgląd – izolowany */}
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <SectionHeader title="Podgląd – Grid" />
            <div ref={previewRef} className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <GridPreviewCard key={`g-${i}`} i={i} />
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <SectionHeader title="Podgląd – Lista" />
            <div className="p-4">
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <ListPreviewCard key={`l-${i}`} i={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Izolacja panelu od zmiennych brandu */}
      <style>{`
        :root {
          --admin-bg: #f6f7fb;
          --admin-text: #0f172a;
        }
        .admin-scope {
          background: var(--admin-bg);
          color: var(--admin-text);
        }
      `}</style>
    </div>
  );
}
