'use client';

import Link from 'next/link';
import { Camera } from 'lucide-react';

type Img = { url?: string | null; order?: number | null };
type OfferType = 'sprzedaz' | 'wynajem' | 'dzierzawa';

export default function ListingCardList({
  id,
  title,
  price,
  area,
  city,
  region,
  images,
  offerType,
}: {
  id: number;
  title: string;
  price: number;
  area: number;
  city?: string | null;
  region?: string | null;
  images?: Img[];
  offerType?: OfferType | null;
}) {
  const sorted = Array.isArray(images)
    ? images.slice().sort((a,b)=>(a?.order ?? 0) - (b?.order ?? 0))
    : [];
  const thumb = sorted[0]?.url || '';
  const count = sorted.length;
  const pricePln = Math.round((price || 0) / 100);
  const perM2 = area > 0 ? Math.round(pricePln / area) : null;

  const chip = offerType === 'sprzedaz' ? 'Sprzedaż'
             : offerType === 'wynajem' ? 'Wynajem'
             : offerType === 'dzierzawa' ? 'Dzierżawa' : null;

  return (
    <Link
      href={`/ogloszenia/${id}`}
      className="group grid grid-cols-[180px_1fr] gap-3 transition hover:shadow-hover hover:-translate-y-0.5"
      style={{
        background: 'var(--lc-list-bg)',
        borderRadius: 'var(--lc-list-radius)',
        boxShadow: '0 1px 1px rgba(0,0,0,.03), 0 6px 18px rgba(0,0,0,.06)',
      }}
    >
      <div className="relative overflow-hidden" style={{ borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb || '/noimg.jpg'}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {!!chip && (
          <div className="absolute top-2 left-0 right-0 flex px-2" style={{ justifyContent: 'var(--lc-list-chip-justify)' }}>
            <span
              className="inline-flex items-center font-semibold"
              style={{
                background: 'var(--lc-list-chip-bg)',
                color: 'var(--lc-list-chip-color)',
                fontSize: 'var(--lc-list-chip-fs)',
                padding: 'var(--lc-list-chip-py) var(--lc-list-chip-px)',
                borderRadius: 'var(--lc-list-chip-radius)',
              }}
            >
              {chip}
            </span>
          </div>
        )}

        <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]">
          <Camera className="h-[14px] w-[14px]" />
          <span>{count}</span>
          <style jsx>{`
            div { background: var(--lc-list-imgcount-bg); color: var(--lc-list-imgcount-color); }
          `}</style>
        </div>
      </div>

      <div className="p-3">
        <div
          className="font-semibold text-gray-900 line-clamp-2"
          style={{ fontSize: 'var(--lc-list-title-size)', textAlign: 'var(--lc-list-title-align)' as any }}
        >
          {title}
        </div>

        {(city || region) && (
          <div className="mt-1 text-xs text-gray-600">{[city, region].filter(Boolean).join(', ')}</div>
        )}

        <div className="mt-2 flex items-center" style={{ justifyContent: 'var(--lc-list-price-justify)' }}>
          <span
            className="inline-flex rounded-md px-2 py-1 text-sm font-semibold"
            style={{ background: 'var(--lc-list-price-bg)', color: 'var(--lc-list-price-color)' }}
          >
            {pricePln.toLocaleString('pl-PL')} zł
          </span>
          {perM2 != null && (
            <span className="ml-2 text-xs text-gray-600">
              {perM2.toLocaleString('pl-PL')} zł/m²
            </span>
          )}
        </div>

        {/* META */}
        <div
          className="flex gap-2"
          style={{
            justifyContent: 'var(--lc-list-meta-justify)',
            marginTop: 'var(--lc-list-meta-mt)',
          }}
        >
          <span
            className="inline-flex"
            style={{
              background: 'var(--lc-list-meta-bg)',
              color: 'var(--lc-list-meta-color)',
              fontSize: 'var(--lc-list-meta-fs)',
              padding: 'var(--lc-list-meta-py) var(--lc-list-meta-px)',
              borderRadius: 'var(--lc-list-meta-radius)',
            }}
          >
            {area.toLocaleString('pl-PL')} m²
          </span>
          {perM2 != null && (
            <span
              className="inline-flex"
              style={{
                background: 'var(--lc-list-meta-bg)',
                color: 'var(--lc-list-meta-color)',
                fontSize: 'var(--lc-list-meta-fs)',
                padding: 'var(--lc-list-meta-py) var(--lc-list-meta-px)',
                borderRadius: 'var(--lc-list-meta-radius)',
              }}
            >
              {perM2.toLocaleString('pl-PL')} zł/m²
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
