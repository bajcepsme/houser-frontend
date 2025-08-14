'use client';

import * as React from 'react';

/** Mała pomoc: wyciągamy tylko cyfry (np. z "789.999 zł" -> "789999") */
const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');
const n = (s: string) => Number(onlyDigits(s) || 0);

/** Badge z ładnym stylem (używamy do typu oferty i kategorii) */
function Pill({
  children,
  tone = 'blue', // blue | violet
}: {
  children: React.ReactNode;
  tone?: 'blue' | 'violet';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  } as const;
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1',
        tones[tone],
      ].join(' ')}
    >
      {children}
    </span>
  );
}

/** Prosta pinezka SVG (nie wymaga bibliotek) */
function MapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
    </svg>
  );
}

type OfferType = 'sprzedaz' | 'wynajem' | 'dzierzawa';

export default function ListingPreview({
  title,
  description,
  price, // "789.999 zł"
  area, // "57 m²"
  category,
  offerType,
  addressCity,
  addressRegion,
  street,
  lat,
  lng,
  files = [],
  youtubeUrl, // nie używamy w preview, ale zostawiam
  extras, // { around, media, details }
}: {
  title: string;
  description: string; // już zsanityzowane w page.tsx
  price: string;
  area: string;
  category: string;
  offerType: OfferType;
  addressCity: string;
  addressRegion: string;
  street?: string;
  lat: number | null;
  lng: number | null;
  files?: File[];
  youtubeUrl?: string;
  extras?: { around?: Record<string, boolean>; media?: Record<string, boolean>; details?: Record<string, any> };
}) {
  const heroSrc = React.useMemo(() => {
    if (files && files.length > 0) {
      try {
        return URL.createObjectURL(files[0]);
      } catch {}
    }
    return '';
  }, [files]);

  const priceNum = n(price);
  const areaNum = n(area);
  const pricePerM2 = areaNum > 0 ? Math.round(priceNum / areaNum) : 0;

  const details = extras?.details || {};

  // zgrabne, krótkie nazwy do „Podsumowania”
  const summaryItems: Array<{ label: string; value?: string | number }> = [
    { label: 'Powierzchnia', value: area || undefined },
    { label: 'Liczba pokoi', value: details?.liczba_pokoi ? String(details.liczba_pokoi) : undefined },
    { label: 'Piętro', value: details?.pietro !== undefined && details?.pietro !== '' ? String(details.pietro) : undefined },
    { label: 'Rynek', value: details?.rynek ? (details.rynek === 'wtorny' ? 'wtórny' : String(details.rynek)) : undefined },
    { label: 'Ogrzewanie', value: details?.ogrzewanie || undefined },
    { label: 'Stan', value: details?.stan || undefined },
    { label: 'Balkon / taras', value: details?.balkon || undefined },
    { label: 'Miejsce parkingowe', value: details?.miejsce_parkingowe || undefined },
  ].filter((i) => i.value);

  const fullAddress = [street, addressCity, addressRegion].filter(Boolean).join(', ');

  return (
    <article className="relative rounded-3xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/5">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 px-5 pt-5 md:px-6 md:pt-6">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-extrabold tracking-tight md:text-2xl">
            {title || 'Twoja oferta'}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 opacity-70" />
            <span className="truncate">{fullAddress || '— lokalizacja —'}</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {area || '—'} • {category || '—'}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-2xl font-extrabold tabular-nums md:text-3xl">
              {price || '—'}
            </div>
            <div className="text-[11px] text-gray-500">
              {pricePerM2 > 0 ? `${pricePerM2.toLocaleString('pl-PL')} zł/m²` : '—'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* typ oferty */}
            <Pill tone="blue">{labelForOffer(offerType)}</Pill>
            {/* kategoria */}
            {category ? <Pill tone="violet">{category}</Pill> : null}
          </div>
        </div>
      </header>

      {/* HERO IMAGE */}
      <div className="px-5 pb-0 pt-4 md:px-6">
        <div className="relative overflow-hidden rounded-2xl">
          {heroSrc ? (
            <img
              src={heroSrc}
              alt=""
              className="h-[340px] w-full object-cover md:h-[420px]"
            />
          ) : (
            <div className="flex h-[260px] w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400 md:h-[340px]">
              Brak zdjęcia — dodaj przynajmniej jedno
            </div>
          )}
        </div>
      </div>

      {/* PODSUMOWANIE */}
      {summaryItems.length > 0 && (
        <section className="px-5 pt-5 md:px-6">
          <h3 className="mb-3 text-base font-semibold text-gray-800">Podsumowanie</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {summaryItems.map((it) => (
              <li
                key={it.label}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <div className="text-[11px] uppercase tracking-wide text-gray-500">{it.label}</div>
                <div className="mt-0.5 font-medium text-gray-900">{String(it.value)}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* OPIS */}
      <section className="px-5 pt-5 md:px-6">
        <h3 className="mb-3 text-base font-semibold text-gray-800">Opis</h3>
        <div
          className="prose prose-sm max-w-none prose-p:my-2 prose-strong:font-semibold"
          dangerouslySetInnerHTML={{ __html: description || '<p>Brak opisu…</p>' }}
        />
      </section>

      {/* MAPA (na końcu) */}
      <section className="px-5 pb-5 pt-5 md:px-6 md:pb-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
          {lat != null && lng != null ? (
            <iframe
              title="Mapa"
              className="h-64 w-full md:h-72"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.openstreetmap.org/export/embed.html?&layer=mapnik&marker=${lat}%2C${lng}&bbox=${lng - 0.02}%2C${lat - 0.01}%2C${lng + 0.02}%2C${lat + 0.01}`}
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-gray-50 text-gray-400 md:h-72">
              Brak współrzędnych — wybierz punkt na mapie
            </div>
          )}
        </div>
      </section>
    </article>
  );
}

function labelForOffer(t?: OfferType) {
  if (t === 'wynajem') return 'Wynajem';
  if (t === 'dzierzawa') return 'Dzierżawa';
  return 'Sprzedaż';
}
