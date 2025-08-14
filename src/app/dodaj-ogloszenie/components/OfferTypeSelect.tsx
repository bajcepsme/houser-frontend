'use client';

import * as React from 'react';

type Offer = 'sprzedaz' | 'wynajem' | 'dzierzawa';

const OPTIONS: Array<{ id: Offer; label: string }> = [
  { id: 'sprzedaz', label: 'Sprzedaż' },
  { id: 'wynajem', label: 'Wynajem' },
  { id: 'dzierzawa', label: 'Dzierżawa' },
];

type Props = {
  value: Offer;
  onChange: (v: Offer) => void;
};

export default function OfferTypeSelect({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 p-1 ring-1 ring-gray-200 shadow-sm">
      {OPTIONS.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={
              active
                ? 'pill-active !px-5 !py-2'
                : 'pill !px-5 !py-2'
            }
            aria-pressed={active}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
