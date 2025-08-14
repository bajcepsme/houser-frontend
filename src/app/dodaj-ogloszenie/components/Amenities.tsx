"use client";

import * as React from "react";

/** Wspólna „pigułka” (chip) */
function Chip({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm shadow-sm outline-none transition",
        "border ring-0 focus-visible:ring-2 focus-visible:ring-blue-300",
        active
          ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-600/95"
          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800",
      ].join(" ")}
      aria-pressed={active}
    >
      <span
        className={[
          "inline-flex h-5 w-5 items-center justify-center rounded-full",
          active ? "bg-white/20" : "bg-gray-100 group-hover:bg-gray-200",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="capitalize">{label.replaceAll("_", " ")}</span>

    </button>
  );
}

/** Proste, lekkie ikonki SVG (bez zewn. zależności) */
const I = {
  pin: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  ),
  tree: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 13 12 3l5 10H7Z" />
      <path d="M5 21h14" />
      <path d="M12 13v8" />
    </svg>
  ),
  bus: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="3" width="16" height="13" rx="2" />
      <path d="M6 16v2M18 16v2M6 11h12" />
    </svg>
  ),
  shop: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9h18l-1.5 10a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2L3 9Z" />
      <path d="M7 3h10l2 6H5l2-6Z" />
    </svg>
  ),
  hospital: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M12 7v6M9 10h6" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" />
    </svg>
  ),
  flame: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 9s1-4-2-6c0 0 .5 3-2 5s-6 4-2 9a6 6 0 0 0 10 0c2-4-1-7-4-8Z" />
    </svg>
  ),
  drop: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2s7 8 7 12a7 7 0 0 1-14 0c0-4 7-12 7-12Z" />
    </svg>
  ),
  pipe: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10h7v4H3zM10 12h11" />
    </svg>
  ),
  wifi: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12a12 12 0 0 1 14 0" />
      <path d="M8 15a7 7 0 0 1 8 0" />
      <path d="M12 18h.01" />
    </svg>
  ),
};

// kolejność i etykiety – możesz dostosować
const NEARBY: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: "centrum", label: "Centrum", icon: I.pin },
  { key: "szkola", label: "Szkoła", icon: I.pin },
  { key: "sklep", label: "Sklep", icon: I.shop },
  { key: "park", label: "Park", icon: I.tree },
  { key: "przystanek", label: "Przystanek", icon: I.bus },
  { key: "apteka", label: "Apteka", icon: I.hospital },
  { key: "basen", label: "Basen", icon: I.drop },
  { key: "przychodnia", label: "Przychodnia", icon: I.hospital },
  { key: "poczta", label: "Poczta", icon: I.pin },
];

const MEDIA: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: "gaz", label: "Gaz", icon: I.flame },
  { key: "prad", label: "Prąd", icon: I.bolt },
  { key: "woda", label: "Woda", icon: I.drop },
  { key: "kanalizacja", label: "Kanalizacja", icon: I.pipe },
  { key: "sila", label: "Siła", icon: I.bolt },
  { key: "internet", label: "Internet", icon: I.wifi },
];

export function NearbyPicker({
  values,
  onToggle,
}: {
  values: Record<string, boolean>;
  onToggle: (key: string, val: boolean) => void;
}) {
  const count = Object.values(values || {}).filter(Boolean).length;
  return (
    <div className="card-modern p-5 md:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Bliska okolica</h3>
        <span className="text-xs text-gray-500">{count > 0 ? `Wybrane: ${count}` : "Opcjonalnie"}</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {NEARBY.map((it) => (
          <Chip
            key={it.key}
            icon={it.icon}
            label={it.label}
            active={!!values?.[it.key]}
            onClick={() => onToggle(it.key, !values?.[it.key])}
          />
        ))}
      </div>
    </div>
  );
}

export function MediaPicker({
  values,
  onToggle,
}: {
  values: Record<string, boolean>;
  onToggle: (key: string, val: boolean) => void;
}) {
  const count = Object.values(values || {}).filter(Boolean).length;
  return (
    <div className="card-modern p-5 md:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Media</h3>
        <span className="text-xs text-gray-500">{count > 0 ? `Wybrane: ${count}` : "Opcjonalnie"}</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {MEDIA.map((it) => (
          <Chip
            key={it.key}
            icon={it.icon}
            label={it.label}
            active={!!values?.[it.key]}
            onClick={() => onToggle(it.key, !values?.[it.key])}
          />
        ))}
      </div>
    </div>
  );
}
