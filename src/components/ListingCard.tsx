"use client";

import Link from "next/link";

type OfferType = "sprzedaz" | "wynajem" | "dzierzawa";
type Img = { url?: string | null; type?: string | null; order?: number | null };

type ListingShape = {
  id: number;
  title: string;
  price: number; // grosze
  area: number;
  address_city?: string;
  address_region?: string;
  city?: string;
  region?: string;
  images?: Img[];
  offer_type?: OfferType | null;
};

type Props =
  | {
      listing: ListingShape;       // stary sposób: przekazujesz jeden obiekt
      onHover?: (id: number | null) => void;
    }
  | {
      id: number;                  // nowy sposób: rozbite pola
      title: string;
      price: number;
      area: number;
      city: string;
      region: string;
      thumb?: string;
      images?: Img[];
      offerType?: OfferType;
      onHover?: (id: number | null) => void;
    };

function fmtNumber(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export default function ListingCard(props: Props) {
  // Ujednolicenie propsów (obsługuje oba style wywołania)
  const unified = "listing" in props ? props.listing : null;

  const id = unified ? unified.id : props.id;
  const title = unified ? unified.title : props.title;
  const price = unified ? unified.price : props.price; // grosze
  const area = unified ? unified.area : props.area;

  const city =
    unified?.address_city ?? unified?.city ?? ("city" in props ? props.city : "");
  const region =
    unified?.address_region ?? unified?.region ?? ("region" in props ? props.region : "");

  const images = unified?.images ?? ("images" in props ? props.images : undefined);
  const offerType =
    unified?.offer_type ?? ("offerType" in props ? props.offerType : undefined);

  // miniatura
  const sorted = Array.isArray(images)
    ? images.slice().sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    : [];
  const thumb =
    ("thumb" in props && props.thumb) ? props.thumb :
    (sorted[0]?.url ?? "");

  const pricePln = Math.round((price || 0) / 100);
  const perM2 = area > 0 ? Math.round(pricePln / area) : null;

  const typeLabel =
    offerType === "sprzedaz" ? "Sprzedaż" :
    offerType === "wynajem"   ? "Wynajem"  :
    offerType === "dzierzawa" ? "Dzierżawa" : undefined;

  const onHover = "onHover" in props ? props.onHover : undefined;

  return (
    <Link
      href={`/ogloszenia/${id}`}
      className="group flex gap-3 rounded-2xl border border-gray-200 bg-white p-3 transition hover:shadow-hover hover:-translate-y-0.5"
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-gray-100 relative">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full bg-gray-100" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
            {title}
          </h3>
          {typeLabel && (
            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              {typeLabel}
            </span>
          )}
        </div>

        {(city || region) && (
          <div className="mt-1 text-xs text-gray-600">
            {[city, region].filter(Boolean).join(", ")}
          </div>
        )}

        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-900">{fmtNumber(pricePln)} zł</span>
          {perM2 != null && <span className="text-gray-500">• {fmtNumber(perM2)} zł/m²</span>}
        </div>
      </div>
    </Link>
  );
}
