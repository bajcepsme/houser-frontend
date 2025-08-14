"use client";

import * as React from "react";

export type OfferType = "sprzedaz" | "wynajem" | "dzierzawa";

type Values = {
  city: string;
  query: string;
  category: string;
  type: OfferType | "";
  priceFrom: string;
  priceTo: string;
};

export default function FilterBar({
  values,
  onChange,
  onReset,
}: {
  values: Values;
  onChange: (v: Partial<Values>) => void;
  onReset: () => void;
}) {
  const Chip = ({
    active,
    children,
    onClick,
  }: {
    active?: boolean;
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1.5 text-sm border transition",
        active
          ? "bg-gray-900 text-white border-gray-900"
          : "bg-white border-gray-200 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Tytuł / fraza */}
      <input
        value={values.query}
        onChange={(e) => onChange({ query: e.target.value })}
        placeholder="Szukaj w tytule/opisie…"
        className="w-full h-10 rounded-xl border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Kategorie */}
      <div className="flex flex-wrap gap-2">
        {["Mieszkania", "Domy", "Lokale usługowe", "Hale i magazyny", "Garaże", "Działki"].map(
          (c) => (
            <Chip
              key={c}
              active={values.category === c}
              onClick={() => onChange({ category: values.category === c ? "" : c })}
            >
              {c}
            </Chip>
          )
        )}
      </div>

      {/* Typ oferty */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "sprzedaz", label: "Sprzedaż" },
          { id: "wynajem", label: "Wynajem" },
          { id: "dzierzawa", label: "Dzierżawa" },
        ].map((t) => (
          <Chip
            key={t.id}
            active={values.type === (t.id as OfferType)}
            onClick={() =>
              onChange({ type: values.type === (t.id as OfferType) ? "" : (t.id as OfferType) })
            }
          >
            {t.label}
          </Chip>
        ))}
      </div>

      {/* Cena */}
      <div className="grid grid-cols-2 gap-2">
        <input
          inputMode="numeric"
          placeholder="Min cena"
          value={values.priceFrom}
          onChange={(e) => onChange({ priceFrom: e.target.value.replace(/\D+/g, "") })}
          className="h-10 rounded-xl border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          inputMode="numeric"
          placeholder="Max cena"
          value={values.priceTo}
          onChange={(e) => onChange({ priceTo: e.target.value.replace(/\D+/g, "") })}
          className="h-10 rounded-xl border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="pt-1">
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Wyczyść
        </button>
      </div>
    </div>
  );
}
