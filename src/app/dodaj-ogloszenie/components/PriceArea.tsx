'use client';
import React from 'react';

type OfferType = 'sprzedaz' | 'wynajem' | 'dzierzawa';

type Props = {
  offerType: OfferType;
  price: string;
  setPrice: (v: string) => void;
  area: string;
  setArea: (v: string) => void;
  pricePerM2: number | null; // grosze/m²
};

export default function PriceArea({ offerType, price, setPrice, area, setArea, pricePerM2 }: Props) {
  const fmtPln = (v: string) => v.replace(/[^\d,.\s]/g, '');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm text-gray-600 mb-1">Cena (PLN)</label>
        <input
          type="text"
          className="form-input w-full"
          value={price}
          onChange={(e) => setPrice(fmtPln(e.target.value))}
          placeholder={offerType === 'sprzedaz' ? 'np. 650 000' : 'np. 3 200'}
        />
        {offerType !== 'sprzedaz' && (
          <div className="text-xs text-gray-500 mt-1">Rozliczenie: miesięcznie</div>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Powierzchnia (m²)</label>
        <input
          type="text"
          className="form-input w-full"
          value={area}
          onChange={(e) => setArea(fmtPln(e.target.value))}
          placeholder="np. 54"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Cena za m²</label>
        <input
          className="form-input w-full bg-gray-100"
          disabled
          value={
            offerType === 'sprzedaz'
              ? (pricePerM2 ? `${Math.round(pricePerM2 / 100).toLocaleString('pl-PL')} zł/m²` : '—')
              : 'miesięcznie'
          }
        />
      </div>
    </div>
  );
}
