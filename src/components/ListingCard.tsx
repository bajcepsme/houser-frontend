'use client';

import Link from 'next/link';
import * as React from 'react';
import { Camera, MapPin, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type ImageT = { url: string; alt?: string };
type View = 'grid' | 'list';

export default function ListingCard({
  id,
  title,
  price,
  area,
  city,
  region,
  images = [],
  offerType,
  ownerAvatarUrl,
  ownerProfileHref,
  ownerId,               // <-- UŻYWAMY TEGO
  view = 'grid',
}: {
  id: number | string;
  title: string;
  price?: number | string;
  area?: number | string;
  city?: string;
  region?: string;
  images?: ImageT[];
  offerType?: string;
  ownerAvatarUrl?: string | null;
  ownerProfileHref?: string;
  view?: View;
  ownerId?: number | string;   // <-- już było w typie, teraz realnie wykorzystywane
}) {
  const href = `/ogloszenia/${id}`;
  const P = view === 'grid' ? '--lc-grid' : '--lc-list';
  const imgUrl = images[0]?.url || '/no-image.jpg';
  const imgCount = images.length || 1;

  const pricePerM2 = calcPricePerM2(price, area);

  // === NOWE: fallback do avatara zalogowanego usera, jeśli to jego ogłoszenie ===
  const { user } = useAuth();
  const resolvedOwnerAvatar = React.useMemo(() => {
    // 1) jeśli przyszło coś z serwera – normalizujemy i zwracamy
    const fromProps = absolutize(ownerAvatarUrl || '');
    if (fromProps) return fromProps;

    // 2) jeśli listing należy do zalogowanego usera – użyj jego zdjęcia z AuthContext
    const uid = ownerId != null ? String(ownerId) : '';
    const ctxId = (user?.id != null) ? String(user.id) : '';
    if (uid && ctxId && uid === ctxId) {
      const ctxRaw =
        (user as any)?.avatar_url ||
        (user as any)?.avatar ||
        (user as any)?.photo_url ||
        '';
      const fromCtx = absolutize(ctxRaw);
      if (fromCtx) return fromCtx;
    }

    // 3) brak danych – zostaw pusty, poniżej pójdzie default
    return '';
  }, [ownerAvatarUrl, ownerId, user]);

  const finalAvatarSrc = resolvedOwnerAvatar || '/avatars/default.jpg';

  return (
    <article
      className={
        view === 'grid'
          ? 'listing-card group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition'
          : 'listing-card group grid gap-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition'
      }
      data-view={view}
      style={view === 'list' ? { gridTemplateColumns: `200px 1fr` } : undefined}
    >
      {/* OBRAZ */}
      <Link
        href={href}
        className="relative block overflow-hidden"
        style={{ aspectRatio: `var(${P}-img-aspect)` as any }}
        aria-label={title}
      >
        <img src={imgUrl} alt={title} className="h-full w-full object-cover" />

        {/* CHIP */}
        <div className="absolute left-0 right-0 top-2 flex px-2" style={{ justifyContent: `var(${P}-chip-justify)` as any }}>
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
            {offerType === 'wynajem' ? 'Wynajem' : 'Sprzedaż'}
          </span>
        </div>

        {/* LICZNIK ZDJĘĆ */}
        <div
          className="absolute inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]"
          style={{
            background: `var(${P}-imgcount-bg)`,
            color: `var(${P}-imgcount-color)`,
            bottom: '8px',
            left: '8px',
          }}
        >
          <Camera className="h-[14px] w-[14px]" />
          <span>{imgCount}</span>
        </div>

        {/* FAV */}
        <div className="absolute right-2 top-2">
          <button
            type="button"
            className="brand-fav-btn inline-flex items-center justify-center"
            data-scope={view}
            aria-label="Dodaj do ulubionych"
            style={{
              width: `var(${P}-fav-size, 36px)`,
              height: `var(${P}-fav-size, 36px)`,
              borderRadius: `var(${P}-fav-radius, 999px)`,
              boxShadow: `var(${P}-fav-shadow, 0 6px 16px rgba(2,6,23,.12))`,
              background: `var(${P}-fav-bg)`,
              color: `var(${P}-fav-color)`,
            }}
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </Link>

      {/* TREŚĆ */}
      <div
        className="p-3 listing-card__body"
        style={{
          background: `var(${P}-bg)`,
          boxShadow: `var(${P}-shadow)`,
          borderRadius: `var(${P}-radius)`,
        }}
      >
        {/* TYTUŁ */}
        <Link
          href={href}
          className="line-clamp-2 text-gray-900 hover:underline"
          style={{
            marginBottom: `var(${P}-title-mb)`,
            fontWeight: `var(${P}-title-weight)` as any,
            fontSize: `var(${P}-title-size)`,
            textAlign: `var(${P}-title-align)` as any,
          }}
        >
          {title}
        </Link>

        {/* ADRES */}
        <div
          className="inline-flex items-center gap-1 text-gray-600"
          style={{
            marginTop: `var(${P}-address-mt)`,
            fontSize: `var(${P}-address-size)`,
            fontWeight: `var(${P}-address-weight)` as any,
          }}
        >
          <MapPin className="h-3.5 w-3.5 opacity-70" />
          <span>
            {city}
            {region ? `, ${region}` : ''}
          </span>
        </div>

        {/* CENA */}
        <div className="flex items-center" style={{ justifyContent: `var(${P}-price-justify)` as any, marginTop: `var(${P}-price-mt)` }}>
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
            {formatPrice(price)}
          </span>
        </div>

        {/* HR */}
        <div
          aria-hidden
          style={{
            height: `calc(var(${P}-hr-thickness) * var(${P}-hr-show))`,
            background: `var(${P}-hr-color)`,
            marginTop: `calc(var(${P}-hr-mt) * var(${P}-hr-show))`,
            marginBottom: `calc(var(${P}-hr-mb) * var(${P}-hr-show))`,
            paddingTop: `calc(var(${P}-hr-pt) * var(${P}-hr-show))`,
            paddingBottom: `calc(var(${P}-hr-pb) * var(${P}-hr-show))`,
            borderRadius: 999,
          }}
        />

        {/* META + AVATAR */}
        <div className="flex items-center justify-between gap-3" style={{ marginTop: `var(${P}-meta-mt)` }}>
          <div className="flex gap-2" style={{ justifyContent: `var(${P}-meta-justify)` as any }}>
            {area ? (
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
                {area} m²
              </span>
            ) : null}

            {pricePerM2 ? (
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
                {pricePerM2} zł/m²
              </span>
            ) : null}
          </div>

          {/* AVATAR */}
          {renderAvatar({ P, src: finalAvatarSrc, ownerProfileHref })}
        </div>
      </div>

      <style>{`
        .brand-fav-btn[data-scope="grid"]:hover{
          background: var(--lc-grid-fav-bg-hover); color: var(--lc-grid-fav-color-hover);
        }
        .brand-fav-btn[data-scope="grid"]:active{
          background: var(--lc-grid-fav-bg-active); color: var(--lc-grid-fav-color-active);
        }
        .brand-fav-btn[data-scope="list"]:hover{
          background: var(--lc-list-fav-bg-hover); color: var(--lc-list-fav-color-hover);
        }
        .brand-fav-btn[data-scope="list"]:active{
          background: var(--lc-list-fav-bg-active); color: var(--lc-list-fav-color-active);
        }
        .listing-card{ transition: transform 220ms ease, box-shadow 220ms ease; will-change: transform; }
        .listing-card:hover{ transform: translateY(-3px); }
      `}</style>
    </article>
  );
}

/* ===== helpers ===== */

function renderAvatar({
  P,
  src,
  ownerProfileHref,
}: {
  P: string;
  src: string;
  ownerProfileHref?: string;
}) {
  const DEFAULT_AVATAR = '/avatars/default.jpg';

  const imgEl = (
    <img
      src={src || DEFAULT_AVATAR}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
      }}
      alt=""
      className="h-full w-full object-cover"
    />
  );

  const commonStyle: React.CSSProperties = {
    width: `var(${P}-avatar-size, 28px)`,
    height: `var(${P}-avatar-size, 28px)`,
    boxShadow: `var(${P}-avatar-shadow, 0 2px 8px rgba(2,6,23,.08))`,
    opacity: `var(${P}-avatar-show, 1)`,
  };

  if (ownerProfileHref) {
    return (
      <Link
        href={ownerProfileHref}
        className="shrink-0 overflow-hidden rounded-full ring-1 ring-black/5 cursor-pointer"
        style={commonStyle}
        aria-label="Profil właściciela"
        title="Zobacz profil"
      >
        {imgEl}
      </Link>
    );
  }

  return (
    <div className="shrink-0 overflow-hidden rounded-full ring-1 ring-black/5" style={commonStyle} title="Avatar">
      {imgEl}
    </div>
  );
}

function formatPrice(p?: number | string) {
  if (p === null || p === undefined || p === '') return '';
  const n = typeof p === 'number' ? p : Number(p);
  if (!Number.isFinite(n)) return String(p);
  return n.toLocaleString('pl-PL') + ' zł';
}

function calcPricePerM2(price?: number | string, area?: number | string) {
  const nPrice = typeof price === 'number' ? price : Number(price);
  const nArea = typeof area === 'number' ? area : Number(area);
  if (!Number.isFinite(nPrice) || !Number.isFinite(nArea) || nArea <= 0) return '';
  const val = Math.round(nPrice / nArea);
  return val.toLocaleString('pl-PL');
}

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
}

function absolutize(path: string) {
  if (!path) return '';
  if (/^(data:|blob:|https?:\/\/)/i.test(path)) return path;
  // usuń wiodące slashe
  let p = path.replace(/^\/+/, '');
  // avatars/... -> storage/avatars/...
  if (p.startsWith('avatars/')) p = `storage/${p}`;
  return `${apiBase()}/${p}`;
}
