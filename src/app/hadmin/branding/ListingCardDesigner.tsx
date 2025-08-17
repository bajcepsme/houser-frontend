"use client";

import * as React from "react";
import { Camera, MapPin } from "lucide-react";
import { applyBrandToHtml, type ListingCardDesignValue, type ListingCardBlock } from "@/lib/brand";

export type { ListingCardDesignValue } from "@/lib/brand";

/* helpers */

function rgbaOrHexToHex(input?: unknown): string {
  const fallback = "#ffffff";
  if (typeof input !== "string" || !input.trim()) return fallback;
  const s = input.trim();
  if (s.startsWith("#")) return s;
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return fallback;
  const r = Number(m[1]), g = Number(m[2]), b = Number(m[3]);
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const DEF_BLOCK: ListingCardBlock = {
  cardBg: "#ffffff",
  cardRadius: 12,
  cardPx: 0,
  cardPy: 0,
  cardShadow: "0 1px 1px rgba(0,0,0,.03), 0 6px 18px rgba(0,0,0,.06)",
  cardShadowHover: "0 6px 10px rgba(0,0,0,.04), 0 14px 30px rgba(0,0,0,.12)",
  cardOutline: "none",
  contentPx: 12,
  contentPy: 12,

  imgAspect: "16 / 9",
  imgHoverScale: 1.03,
  imgWidthList: "180px",

  transitionMs: 300,
  hoverTranslate: "-2px",
  iconsColor: "#64748b",

  titleSize: 16,
  titleWeight: 600,
  titleColor: "#111827",
  titleAlign: "left",
  titleMt: 0,
  titleMb: 6,
  titlePx: 0,
  titlePy: 0,

  addressSize: 12,
  addressWeight: 400,
  addressColor: "#6b7280",
  addressAlign: "left",
  addressMt: 4,
  addressMb: 0,
  addressPx: 0,
  addressPy: 0,

  priceBg: "#ffb800",
  priceColor: "#111827",
  priceSize: 14,
  priceWeight: 600,
  priceJustify: "left",
  priceMt: 8,
  priceMb: 0,
  pricePx: 8,
  pricePy: 4,
  priceRadius: 8,

  chipBg: "rgba(0,0,0,.75)",
  chipColor: "#ffffff",
  chipBorder: "none",
  chipJustify: "left",
  chipFont: 11,
  chipPx: 8,
  chipPy: 2,
  chipRadius: 999,

  imgCounterBg: "rgba(0,0,0,.55)",
  imgCounterColor: "#ffffff",

  metaBg: "rgba(17,24,39,.06)",
  metaColor: "#111827",
  metaRadius: 8,
  metaPx: 8,
  metaPy: 4,
  metaFont: 12,
  metaWeight: 500,
  metaJustify: "left",
  metaMt: 8,
  metaMb: 0,
};

const DEF: ListingCardDesignValue = {
  grid: { ...DEF_BLOCK },
  list: { ...DEF_BLOCK, titleSize: 16, imgWidthList: "180px" },
};

const DEMO = [
  {
    img: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80",
    title: "Dwupokojowe mieszkanie z dużym balkonem",
    city: "Warszawa, Mokotów",
    price: "749 000 zł",
    photos: 7,
  },
  {
    img: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80",
    title: "Nowe osiedle, piękne wykończenie",
    city: "Poznań, Rataje",
    price: "429 000 zł",
    photos: 12,
  },
  {
    img: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80",
    title: "Apartament w centrum z widokiem",
    city: "Gdańsk, Śródmieście",
    price: "1 290 000 zł",
    photos: 5,
  },
];

/* UI mini */

function ColorInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const safe = typeof value === "string" && value.trim() ? value : "#ffffff";
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        className="h-10 w-14 rounded border p-0"
        value={rgbaOrHexToHex(safe)}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        className="input-modern w-full"
        value={safe}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
function Range({ value, onChange, min, max, step = 1 }: { value: number; onChange:(v:number)=>void; min:number; max:number; step?:number }) {
  return <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={(e)=>onChange(Number(e.target.value))} />;
}
function SelectAlign({ value, onChange }: { value: "left"|"center"|"right"; onChange:(v:any)=>void }) {
  return (
    <select className="input-modern w-full" value={value} onChange={(e)=>onChange(e.target.value as any)}>
      <option value="left">Lewo</option>
      <option value="center">Środek</option>
      <option value="right">Prawo</option>
    </select>
  );
}
const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
);
const Section: React.FC<{ title: string; children: React.ReactNode; open?: boolean }> = ({ title, children, open }) => (
  <details className="rounded-xl border bg-white" {...(open ? { open: true } : {})}>
    <summary className="cursor-pointer select-none px-4 py-3 font-semibold bg-gray-50 rounded-xl">{title}</summary>
    <div className="p-4 space-y-4">{children}</div>
  </details>
);

/* PREVIEW */

function GridPreviewCard({ d }: { d: typeof DEMO[number] }) {
  const P = "--lc-grid";
  return (
    <div
      className="group overflow-hidden"
      style={{
        borderRadius: `var(${P}-radius)`,
        background: `var(${P}-bg)`,
        boxShadow: `var(${P}-shadow)`,
        border: `var(${P}-outline)`,
        transition: "box-shadow var(--lc-transition,300ms) ease, transform var(--lc-transition,300ms) ease",
      }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: `var(${P}-img-aspect)` as any }}>
        <img src={d.img} alt="" className="h-full w-full object-cover" style={{ transition: "transform var(--lc-transition,300ms) ease" }} />
        <div className="absolute top-2 left-0 right-0 flex px-2" style={{ justifyContent: `var(${P}-chip-justify)` as any }}>
          <span className="inline-flex items-center font-semibold" style={{ background: `var(${P}-chip-bg)`, color: `var(${P}-chip-color)`, border: `var(${P}-chip-border)`, fontSize: `var(${P}-chip-fs)`, padding: `var(${P}-chip-py) var(${P}-chip-px)`, borderRadius: `var(${P}-chip-radius)` }}>Sprzedaż</span>
        </div>
        <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]" style={{ background: `var(${P}-imgcount-bg)`, color: `var(${P}-imgcount-color)` }}>
          <Camera className="h-[14px] w-[14px]" />
          <span>{d.photos}</span>
        </div>
      </div>

      <div className="p-3" style={{ padding: `var(${P}-content-py) var(${P}-content-px)` }}>
        <div className="line-clamp-2" style={{ fontSize: `var(${P}-title-size)`, fontWeight: `var(${P}-title-weight)` as any, color: `var(${P}-title-color)`, textAlign: `var(${P}-title-align)` as any, marginTop: `var(${P}-title-mt)`, marginBottom: `var(${P}-title-mb)`, padding: `var(${P}-title-py) var(${P}-title-px)` }}>
          {d.title}
        </div>

        <div className="inline-flex items-center gap-1" style={{ fontSize: `var(${P}-address-size)`, fontWeight: `var(${P}-address-weight)` as any, color: `var(${P}-address-color)`, textAlign: `var(${P}-address-align)` as any, marginTop: `var(${P}-address-mt)`, marginBottom: `var(${P}-address-mb)`, padding: `var(${P}-address-py) var(${P}-address-px)` }}>
          <MapPin className="h-3.5 w-3.5" style={{ color: `var(${P}-icons-color)` }} />
          <span>{d.city}</span>
        </div>

        <div className="flex items-center" style={{ justifyContent: `var(${P}-price-justify)` as any, marginTop: `var(${P}-price-mt)`, marginBottom: `var(${P}-price-mb)` }}>
          <span className="inline-flex rounded-md" style={{ background: `var(${P}-price-bg)`, color: `var(${P}-price-color)`, fontSize: `var(${P}-price-size)`, fontWeight: `var(${P}-price-weight)` as any, padding: `var(${P}-price-py) var(${P}-price-px)`, borderRadius: `var(${P}-price-radius)` }}>
            {d.price}
          </span>
        </div>

        <div className="flex gap-2" style={{ justifyContent: `var(${P}-meta-justify)` as any, marginTop: `var(${P}-meta-mt)`, marginBottom: `var(${P}-meta-mb)` }}>
          <span className="inline-flex" style={{ background: `var(${P}-meta-bg)`, color: `var(${P}-meta-color)`, fontSize: `var(${P}-meta-fs)`, fontWeight: `var(${P}-meta-weight)` as any, padding: `var(${P}-meta-py) var(${P}-meta-px)`, borderRadius: `var(${P}-meta-radius)` }}>
            52 m²
          </span>
          <span className="inline-flex" style={{ background: `var(${P}-meta-bg)`, color: `var(${P}-meta-color)`, fontSize: `var(${P}-meta-fs)`, fontWeight: `var(${P}-meta-weight)` as any, padding: `var(${P}-meta-py) var(${P}-meta-px)`, borderRadius: `var(${P}-meta-radius)` }}>
            14 300 zł/m²
          </span>
        </div>
      </div>

      <style jsx>{`
        div.group:hover { box-shadow: var(${P}-shadow-hover); transform: translateY(var(${P}-hover-translate, -2px)); }
        div.group:hover img { transform: scale(var(${P}-img-hover-scale, 1.03)); }
      `}</style>
    </div>
  );
}

function ListPreviewCard({ d }: { d: typeof DEMO[number] }) {
  const P = "--lc-list";
  return (
    <div
      className="group grid gap-3 overflow-hidden"
      style={{
        borderRadius: `var(${P}-radius)`,
        background: `var(${P}-bg)`,
        boxShadow: `var(${P}-shadow)`,
        border: `var(${P}-outline)`,
        transition: "box-shadow var(--lc-transition,300ms) ease, transform var(--lc-transition,300ms) ease",
        gridTemplateColumns: `var(${P}-img-w) 1fr`,
      }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: `var(${P}-img-aspect)` as any }}>
        <img src={d.img} alt="" className="h-full w-full object-cover" style={{ transition: "transform var(--lc-transition,300ms) ease" }} />
        <div className="absolute top-2 left-0 right-0 flex px-2" style={{ justifyContent: `var(${P}-chip-justify)` as any }}>
          <span className="inline-flex items-center font-semibold" style={{ background: `var(${P}-chip-bg)`, color: `var(${P}-chip-color)`, border: `var(${P}-chip-border)`, fontSize: `var(${P}-chip-fs)`, padding: `var(${P}-chip-py) var(${P}-chip-px)`, borderRadius: `var(${P}-chip-radius)` }}>
            Wynajem
          </span>
        </div>
        <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]" style={{ background: `var(${P}-imgcount-bg)`, color: `var(${P}-imgcount-color)` }}>
          <Camera className="h-[14px] w-[14px]" />
          <span>{d.photos}</span>
        </div>
      </div>

      <div className="p-3" style={{ padding: `var(${P}-content-py) var(${P}-content-px)` }}>
        <div className="line-clamp-2" style={{ fontSize: `var(${P}-title-size)`, fontWeight: `var(${P}-title-weight)` as any, color: `var(${P}-title-color)`, textAlign: `var(${P}-title-align)` as any, marginTop: `var(${P}-title-mt)`, marginBottom: `var(${P}-title-mb)`, padding: `var(${P}-title-py) var(${P}-title-px)` }}>
          {d.title}
        </div>

        <div className="inline-flex items-center gap-1" style={{ fontSize: `var(${P}-address-size)`, fontWeight: `var(${P}-address-weight)` as any, color: `var(${P}-address-color)`, textAlign: `var(${P}-address-align)` as any, marginTop: `var(${P}-address-mt)`, marginBottom: `var(${P}-address-mb)`, padding: `var(${P}-address-py) var(${P}-address-px)` }}>
          <MapPin className="h-3.5 w-3.5" style={{ color: `var(${P}-icons-color)` }} />
          <span>{d.city}</span>
        </div>

        <div className="flex items-center" style={{ justifyContent: `var(${P}-price-justify)` as any, marginTop: `var(${P}-price-mt)`, marginBottom: `var(${P}-price-mb)` }}>
          <span className="inline-flex rounded-md" style={{ background: `var(${P}-price-bg)`, color: `var(${P}-price-color)`, fontSize: `var(${P}-price-size)`, fontWeight: `var(${P}-price-weight)` as any, padding: `var(${P}-price-py) var(${P}-price-px)`, borderRadius: `var(${P}-price-radius)` }}>
            {d.price}
          </span>
        </div>

        <div className="flex gap-2" style={{ justifyContent: `var(${P}-meta-justify)` as any, marginTop: `var(${P}-meta-mt)`, marginBottom: `var(${P}-meta-mb)` }}>
          <span className="inline-flex" style={{ background: `var(${P}-meta-bg)`, color: `var(${P}-meta-color)`, fontSize: `var(${P}-meta-fs)`, fontWeight: `var(${P}-meta-weight)` as any, padding: `var(${P}-meta-py) var(${P}-meta-px)`, borderRadius: `var(${P}-meta-radius)` }}>
            64 m²
          </span>
          <span className="inline-flex" style={{ background: `var(${P}-meta-bg)`, color: `var(${P}-meta-color)`, fontSize: `var(${P}-meta-fs)`, fontWeight: `var(${P}-meta-weight)` as any, padding: `var(${P}-meta-py) var(${P}-meta-px)`, borderRadius: `var(${P}-meta-radius)` }}>
            13 900 zł/m²
          </span>
        </div>
      </div>

      <style jsx>{`
        div.group:hover { box-shadow: var(${P}-shadow-hover); transform: translateY(var(${P}-hover-translate, -2px)); }
        div.group:hover img { transform: scale(var(${P}-img-hover-scale, 1.03)); }
      `}</style>
    </div>
  );
}

/* DESIGNER */

export default function ListingCardDesigner({
  value,
  onChange,
}: {
  value?: ListingCardDesignValue;
  onChange: (v: ListingCardDesignValue) => void;
}) {
  const [v, setV] = React.useState<ListingCardDesignValue>(value || DEF);
  React.useEffect(() => {
    onChange(v);
    applyBrandToHtml({ listing_card: v } as any);
  }, [v]); // eslint-disable-line

  const up = (side: "grid" | "list", patch: Partial<ListingCardBlock>) =>
    setV((s) => ({ ...s, [side]: { ...(s[side] || {}), ...patch } }));

  const grid = v.grid || DEF_BLOCK;
  const list = v.list || DEF_BLOCK;

  const Row = (p: any) => <div className="grid grid-cols-1 md:grid-cols-2 gap-4" {...p} />;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
      {/* Ustawienia */}
      <div className="space-y-4">
        <details className="rounded-xl border bg-white" open>
          <summary className="cursor-pointer select-none px-4 py-3 font-semibold bg-gray-50 rounded-xl">GRID – Karta</summary>
          <div className="p-4 space-y-4">
            <Row>
              <div><div className="mb-1 text-sm font-medium">Tło</div><ColorInput value={grid.cardBg} onChange={(x)=>up("grid",{cardBg:x})}/></div>
              <div><div className="mb-1 text-sm font-medium">Cień</div><input className="input-modern w-full" value={grid.cardShadow || ""} onChange={(e)=>up("grid",{cardShadow:e.target.value})}/></div>
              <div><div className="mb-1 text-sm font-medium">Cień (hover)</div><input className="input-modern w-full" value={grid.cardShadowHover || ""} onChange={(e)=>up("grid",{cardShadowHover:e.target.value})}/></div>
              <div><div className="mb-1 text-sm font-medium">Obrys (CSS)</div><input className="input-modern w-full" value={grid.cardOutline || ""} onChange={(e)=>up("grid",{cardOutline:e.target.value})}/></div>
            </Row>
            <Row>
              <div><div className="mb-1 text-sm font-medium">Zaokrąglenie</div><Range value={grid.cardRadius ?? 12} min={0} max={32} onChange={(n)=>up("grid",{cardRadius:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Padding X</div><Range value={grid.cardPx ?? 0} min={0} max={32} onChange={(n)=>up("grid",{cardPx:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Padding Y</div><Range value={grid.cardPy ?? 0} min={0} max={32} onChange={(n)=>up("grid",{cardPy:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Padding treści</div><input type="number" className="input-modern w-full" value={grid.contentPx ?? 12} onChange={(e)=>up("grid",{contentPx:Number(e.target.value)})}/></div>
            </Row>
          </div>
        </details>

        <details className="rounded-xl border bg-white">
          <summary className="cursor-pointer select-none px-4 py-3 font-semibold bg-gray-50 rounded-xl">GRID – Obraz</summary>
          <div className="p-4 space-y-4">
            <Row>
              <div><div className="mb-1 text-sm font-medium">Proporcje</div><input className="input-modern w-full" value={grid.imgAspect!} onChange={(e)=>up("grid",{imgAspect:e.target.value})}/></div>
              <div><div className="mb-1 text-sm font-medium">Skala na hover</div><input type="number" step={0.01} className="input-modern w-full" value={grid.imgHoverScale ?? 1.03} onChange={(e)=>up("grid",{imgHoverScale:Number(e.target.value)})}/></div>
              <div><div className="mb-1 text-sm font-medium">Przesunięcie na hover</div><input className="input-modern w-full" value={grid.hoverTranslate || "-2px"} onChange={(e)=>up("grid",{hoverTranslate:e.target.value})}/></div>
              <div><div className="mb-1 text-sm font-medium">Animacja (ms)</div><input type="number" className="input-modern w-full" value={grid.transitionMs ?? 300} onChange={(e)=>up("grid",{transitionMs:Number(e.target.value)})}/></div>
            </Row>
          </div>
        </details>

        <details className="rounded-xl border bg-white">
          <summary className="cursor-pointer select-none px-4 py-3 font-semibold bg-gray-50 rounded-xl">GRID – Tytuł</summary>
          <div className="p-4 space-y-4">
            <Row>
              <div><div className="mb-1 text-sm font-medium">Kolor</div><ColorInput value={grid.titleColor} onChange={(x)=>up("grid",{titleColor:x})}/></div>
              <div><div className="mb-1 text-sm font-medium">Rozmiar</div><Range value={grid.titleSize ?? 16} min={12} max={26} onChange={(n)=>up("grid",{titleSize:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Grubość</div><Range value={grid.titleWeight ?? 600} min={300} max={900} step={50} onChange={(n)=>up("grid",{titleWeight:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Wyrównanie</div><SelectAlign value={(grid.titleAlign as any)||"left"} onChange={(v)=>up("grid",{titleAlign:v})}/></div>
            </Row>
            <Row>
              <div><div className="mb-1 text-sm font-medium">Margin top</div><Range value={grid.titleMt ?? 0} min={0} max={24} onChange={(n)=>up("grid",{titleMt:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Margin bottom</div><Range value={grid.titleMb ?? 6} min={0} max={24} onChange={(n)=>up("grid",{titleMb:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Pad X</div><Range value={grid.titlePx ?? 0} min={0} max={24} onChange={(n)=>up("grid",{titlePx:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Pad Y</div><Range value={grid.titlePy ?? 0} min={0} max={16} onChange={(n)=>up("grid",{titlePy:n})}/></div>
            </Row>
          </div>
        </details>

        <details className="rounded-xl border bg-white">
          <summary className="cursor-pointer select-none px-4 py-3 font-semibold bg-gray-50 rounded-xl">GRID – Adres</summary>
          <div className="p-4 space-y-4">
            <Row>
              <div><div className="mb-1 text-sm font-medium">Kolor</div><ColorInput value={grid.addressColor} onChange={(x)=>up("grid",{addressColor:x})}/></div>
              <div><div className="mb-1 text-sm font-medium">Rozmiar</div><Range value={grid.addressSize ?? 12} min={10} max={18} onChange={(n)=>up("grid",{addressSize:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Grubość</div><Range value={grid.addressWeight ?? 400} min={300} max={800} step={50} onChange={(n)=>up("grid",{addressWeight:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Wyrównanie</div><SelectAlign value={(grid.addressAlign as any)||"left"} onChange={(v)=>up("grid",{addressAlign:v})}/></div>
            </Row>
            <Row>
              <div><div className="mb-1 text-sm font-medium">Margin top</div><Range value={grid.addressMt ?? 4} min={0} max={24} onChange={(n)=>up("grid",{addressMt:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Margin bottom</div><Range value={grid.addressMb ?? 0} min={0} max={24} onChange={(n)=>up("grid",{addressMb:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Pad X</div><Range value={grid.addressPx ?? 0} min={0} max={24} onChange={(n)=>up("grid",{addressPx:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Pad Y</div><Range value={grid.addressPy ?? 0} min={0} max={16} onChange={(n)=>up("grid",{addressPy:n})}/></div>
            </Row>
          </div>
        </details>

        <details className="rounded-xl border bg-white">
          <summary className="cursor-pointer select-none px-4 py-3 font-semibold bg-gray-50 rounded-xl">GRID – Cena</summary>
          <div className="p-4 space-y-4">
            <Row>
              <div><div className="mb-1 text-sm font-medium">Tło</div><ColorInput value={grid.priceBg} onChange={(x)=>up("grid",{priceBg:x})}/></div>
              <div><div className="mb-1 text-sm font-medium">Tekst</div><ColorInput value={grid.priceColor} onChange={(x)=>up("grid",{priceColor:x})}/></div>
              <div><div className="mb-1 text-sm font-medium">Rozmiar</div><Range value={grid.priceSize ?? 14} min={10} max={22} onChange={(n)=>up("grid",{priceSize:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Grubość</div><Range value={grid.priceWeight ?? 600} min={300} max={900} step={50} onChange={(n)=>up("grid",{priceWeight:n})}/></div>
            </Row>
            <Row>
              <div><div className="mb-1 text-sm font-medium">Pozycja</div><SelectAlign value={(grid.priceJustify as any)||"left"} onChange={(v)=>up("grid",{priceJustify:v})}/></div>
              <div><div className="mb-1 text-sm font-medium">Margin top</div><Range value={grid.priceMt ?? 8} min={0} max={24} onChange={(n)=>up("grid",{priceMt:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Margin bottom</div><Range value={grid.priceMb ?? 0} min={0} max={24} onChange={(n)=>up("grid",{priceMb:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Radius</div><Range value={grid.priceRadius ?? 8} min={0} max={24} onChange={(n)=>up("grid",{priceRadius:n})}/></div>
            </Row>
            <Row>
              <div><div className="mb-1 text-sm font-medium">Pad X</div><Range value={grid.pricePx ?? 8} min={0} max={24} onChange={(n)=>up("grid",{pricePx:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Pad Y</div><Range value={grid.pricePy ?? 4} min={0} max={16} onChange={(n)=>up("grid",{pricePy:n})}/></div>
            </Row>
          </div>
        </details>

        <details className="rounded-xl border bg-white">
          <summary className="cursor-pointer select-none px-4 py-3 font-semibold bg-gray-50 rounded-xl">GRID – Chip</summary>
          <div className="p-4 space-y-4">
            <Row>
              <div><div className="mb-1 text-sm font-medium">Tło</div><ColorInput value={grid.chipBg} onChange={(x)=>up("grid",{chipBg:x})}/></div>
              <div><div className="mb-1 text-sm font-medium">Tekst</div><ColorInput value={grid.chipColor} onChange={(x)=>up("grid",{chipColor:x})}/></div>
              <div><div className="mb-1 text-sm font-medium">Border (CSS)</div><input className="input-modern w-full" value={grid.chipBorder || ""} onChange={(e)=>up("grid",{chipBorder:e.target.value})}/></div>
              <div><div className="mb-1 text-sm font-medium">Pozycja</div><SelectAlign value={(grid.chipJustify as any)||"left"} onChange={(v)=>up("grid",{chipJustify:v})}/></div>
            </Row>
            <Row>
              <div><div className="mb-1 text-sm font-medium">Font</div><Range value={grid.chipFont ?? 11} min={10} max={16} onChange={(n)=>up("grid",{chipFont:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Pad X</div><Range value={grid.chipPx ?? 8} min={0} max={20} onChange={(n)=>up("grid",{chipPx:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Pad Y</div><Range value={grid.chipPy ?? 2} min={0} max={12} onChange={(n)=>up("grid",{chipPy:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Radius</div><Range value={grid.chipRadius ?? 999} min={0} max={40} onChange={(n)=>up("grid",{chipRadius:n})}/></div>
            </Row>
          </div>
        </details>

        <details className="rounded-xl border bg-white">
          <summary className="cursor-pointer select-none px-4 py-3 font-semibold bg-gray-50 rounded-xl">GRID – Meta + Ikony</summary>
          <div className="p-4 space-y-4">
            <Row>
              <div><div className="mb-1 text-sm font-medium">Meta – tło</div><ColorInput value={grid.metaBg} onChange={(x)=>up("grid",{metaBg:x})}/></div>
              <div><div className="mb-1 text-sm font-medium">Meta – tekst</div><ColorInput value={grid.metaColor} onChange={(x)=>up("grid",{metaColor:x})}/></div>
              <div><div className="mb-1 text-sm font-medium">Meta – font</div><Range value={grid.metaFont ?? 12} min={10} max={16} onChange={(n)=>up("grid",{metaFont:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Meta – grubość</div><Range value={grid.metaWeight ?? 500} min={300} max={800} step={50} onChange={(n)=>up("grid",{metaWeight:n})}/></div>
            </Row>
            <Row>
              <div><div className="mb-1 text-sm font-medium">Meta – pad X</div><Range value={grid.metaPx ?? 8} min={0} max={24} onChange={(n)=>up("grid",{metaPx:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Meta – pad Y</div><Range value={grid.metaPy ?? 4} min={0} max={16} onChange={(n)=>up("grid",{metaPy:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Meta – radius</div><Range value={grid.metaRadius ?? 8} min={0} max={24} onChange={(n)=>up("grid",{metaRadius:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Meta – pozycja</div><SelectAlign value={(grid.metaJustify as any)||"left"} onChange={(v)=>up("grid",{metaJustify:v})}/></div>
            </Row>
            <Row>
              <div><div className="mb-1 text-sm font-medium">Meta – margin top</div><Range value={grid.metaMt ?? 8} min={0} max={32} onChange={(n)=>up("grid",{metaMt:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Meta – margin bottom</div><Range value={grid.metaMb ?? 0} min={0} max={32} onChange={(n)=>up("grid",{metaMb:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Ikony – kolor</div><ColorInput value={grid.iconsColor} onChange={(x)=>up("grid",{iconsColor:x})}/></div>
            </Row>
          </div>
        </details>

        <details className="rounded-xl border bg-white" open>
          <summary className="cursor-pointer select-none px-4 py-3 font-semibold bg-gray-50 rounded-xl">LIST – Karta + Obraz</summary>
          <div className="p-4 space-y-4">
            <Row>
              <div><div className="mb-1 text-sm font-medium">Szerokość obrazu (np. 180px)</div><input className="input-modern w-full" value={list.imgWidthList!} onChange={(e)=>up("list",{imgWidthList:e.target.value})}/></div>
              <div><div className="mb-1 text-sm font-medium">Proporcje obrazu</div><input className="input-modern w-full" value={list.imgAspect!} onChange={(e)=>up("list",{imgAspect:e.target.value})}/></div>
              <div><div className="mb-1 text-sm font-medium">Skala na hover</div><input type="number" step={0.01} className="input-modern w-full" value={list.imgHoverScale ?? 1.03} onChange={(e)=>up("list",{imgHoverScale:Number(e.target.value)})}/></div>
              <div><div className="mb-1 text-sm font-medium">Ikony – kolor</div><ColorInput value={list.iconsColor} onChange={(x)=>up("list",{iconsColor:x})}/></div>
            </Row>
            <Row>
              <div><div className="mb-1 text-sm font-medium">Tło karty</div><ColorInput value={list.cardBg} onChange={(x)=>up("list",{cardBg:x})}/></div>
              <div><div className="mb-1 text-sm font-medium">Cień</div><input className="input-modern w-full" value={list.cardShadow || ""} onChange={(e)=>up("list",{cardShadow:e.target.value})}/></div>
              <div><div className="mb-1 text-sm font-medium">Cień (hover)</div><input className="input-modern w-full" value={list.cardShadowHover || ""} onChange={(e)=>up("list",{cardShadowHover:e.target.value})}/></div>
              <div><div className="mb-1 text-sm font-medium">Obrys (CSS)</div><input className="input-modern w-full" value={list.cardOutline || ""} onChange={(e)=>up("list",{cardOutline:e.target.value})}/></div>
            </Row>
          </div>
        </details>

        <details className="rounded-xl border bg-white">
          <summary className="cursor-pointer select-none px-4 py-3 font-semibold bg-gray-50 rounded-xl">LIST – Tytuł / Cena / Chip / Meta</summary>
          <div className="p-4 space-y-4">
            <Row>
              <div><div className="mb-1 text-sm font-medium">Tytuł – kolor</div><ColorInput value={list.titleColor} onChange={(x)=>up("list",{titleColor:x})}/></div>
              <div><div className="mb-1 text-sm font-medium">Tytuł – rozmiar</div><Range value={list.titleSize ?? 16} min={12} max={28} onChange={(n)=>up("list",{titleSize:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Tytuł – grubość</div><Range value={list.titleWeight ?? 600} min={300} max={900} step={50} onChange={(n)=>up("list",{titleWeight:n})}/></div>
              <div><div className="mb-1 text-sm font-medium">Tytuł – wyrównanie</div><SelectAlign value={(list.titleAlign as any)||"left"} onChange={(v)=>up("list",{titleAlign:v})}/></div>
            </Row>
            <Row>
              <div><div className="mb-1 text-sm font-medium">Cena – tło</div><ColorInput value={list.priceBg} onChange={(x)=>up("list",{priceBg:x})}/></div>
              <div><div className="mb-1 text-sm font-medium">Cena – tekst</div><ColorInput value={list.priceColor} onChange={(x)=>up("list",{priceColor:x})}/></div>
              <div><div className="mb-1 text-sm font-medium">Cena – pozycja</div><SelectAlign value={(list.priceJustify as any)||"left"} onChange={(v)=>up("list",{priceJustify:v})}/></div>
              <div><div className="mb-1 text-sm font-medium">Chip – tło</div><ColorInput value={list.chipBg} onChange={(x)=>up("list",{chipBg:x})}/></div>
            </Row>
          </div>
        </details>
      </div>

      {/* Podgląd */}
      <div className="xl:sticky xl:top-4 space-y-6">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="px-5 py-4 border-b bg-gray-50 font-semibold">Podgląd – Grid</div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEMO.map((d, i) => <GridPreviewCard key={i} d={d} />)}
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="px-5 py-4 border-b bg-gray-50 font-semibold">Podgląd – Lista</div>
          <div className="p-5 space-y-4">
            {DEMO.map((d, i) => <ListPreviewCard key={i} d={d} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
