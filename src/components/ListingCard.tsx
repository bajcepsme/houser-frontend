"use client";

import Link from "next/link";
import { Camera, MapPin } from "lucide-react";

type OfferType = "sprzedaz" | "wynajem" | "dzierzawa";
type Img = { url?: string | null; order?: number | null };

type ListingShape = {
  id: number;
  title: string;
  price: number; // grosze
  area: number;
  address_city?: string | null;
  address_region?: string | null;
  city?: string | null;
  region?: string | null;
  images?: Img[];
  offer_type?: OfferType | null;
};

type Props =
  | {
      listing: ListingShape;
      view?: "grid" | "list";
      onHover?: (id: number | null) => void;
    }
  | {
      id: number;
      title: string;
      price: number;
      area: number;
      city?: string | null;
      region?: string | null;
      images?: Img[];
      offerType?: OfferType | null;
      view?: "grid" | "list";
      onHover?: (id: number | null) => void;
    };

function nfmt(n: number) {
  return n.toLocaleString("pl-PL");
}

function titleForOffer(o?: OfferType | null) {
  if (o === "sprzedaz") return "Sprzedaż";
  if (o === "wynajem") return "Wynajem";
  if (o === "dzierzawa") return "Dzierżawa";
  return null;
}

export default function ListingCard(props: Props) {
  const unified = "listing" in props ? props.listing : null;

  const id = unified ? unified.id : props.id;
  const title = unified ? unified.title : props.title;
  const price = unified ? unified.price : props.price;
  const area = unified ? unified.area : props.area;
  const city =
    unified?.address_city ?? unified?.city ?? ("city" in props ? props.city : "");
  const region =
    unified?.address_region ?? unified?.region ?? ("region" in props ? props.region : "");
  const images = unified?.images ?? ("images" in props ? props.images : undefined);
  const offerType =
    unified?.offer_type ?? ("offerType" in props ? props.offerType : undefined);
  const view = ("view" in props && props.view) ? props.view : "grid";
  const onHover = "onHover" in props ? props.onHover : undefined;

  const sorted = Array.isArray(images)
    ? images.slice().sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    : [];
  const thumb = sorted[0]?.url || "";
  const imgCount = sorted.length;

  const pricePln = Math.round((price || 0) / 100);
  const perM2 = area > 0 ? Math.round(pricePln / area) : null;
  const chip = titleForOffer(offerType);

  const Address = (
    <div
      className="text-gray-600 inline-flex items-center gap-1"
      style={{
        marginTop: view === "list" ? "var(--lc-list-address-mt)" : "var(--lc-grid-address-mt)",
        fontSize: view === "list" ? "var(--lc-list-address-size)" : "var(--lc-grid-address-size)",
        fontWeight: view === "list"
          ? ("var(--lc-list-address-weight)" as any)
          : ("var(--lc-grid-address-weight)" as any),
      }}
    >
      <MapPin className="h-3.5 w-3.5 opacity-70" />
      <span>{[city, region].filter(Boolean).join(", ")}</span>
    </div>
  );

  const cardVars =
    view === "list"
      ? {
          prefix: "--lc-list",
          className:
            "group grid grid-cols-[180px_1fr] gap-3 transition hover:-translate-y-0.5",
          imageWrapStyle: {
            borderTopLeftRadius: "inherit",
            borderBottomLeftRadius: "inherit",
            // ważne: korzystamy z -img-aspect
            aspectRatio: "var(--lc-list-img-aspect)" as any,
          },
        }
      : {
          prefix: "--lc-grid",
          className: "group block transition hover:-translate-y-0.5",
          imageWrapStyle: {
            borderTopLeftRadius: "inherit",
            borderTopRightRadius: "inherit",
            aspectRatio: "var(--lc-grid-img-aspect)" as any,
          },
        };

  const P = cardVars.prefix;

  const Chip = !!chip && (
    <div
      className="absolute top-2 left-0 right-0 flex px-2"
      style={{ justifyContent: `var(${P}-chip-justify)` }}
    >
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
        {chip}
      </span>
    </div>
  );

  const ImgCount = (
    <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]"
         style={{ background: `var(${P}-imgcount-bg)`, color: `var(${P}-imgcount-color)` }}>
      <Camera className="h-[14px] w-[14px]" />
      <span>{imgCount}</span>
    </div>
  );

  const Title = (
    <div
      className="line-clamp-2 text-gray-900"
      style={{
        marginBottom: `var(${P}-title-mb)`,
        fontWeight: `var(${P}-title-weight)` as any,
        fontSize: `var(${P}-title-size)`,
        textAlign: `var(${P}-title-align)` as any,
      }}
    >
      {title}
    </div>
  );

  const Price = (
    <div
      className="flex items-center"
      style={{
        justifyContent: `var(${P}-price-justify)`,
        marginTop: `var(${P}-price-mt)`,
      }}
    >
      <span
        className="inline-flex rounded-md"
        style={{
          background: `var(${P}-price-bg)`,
          color: `var(${P}-price-color)`,
          fontSize: `var(${P}-price-size)`,
          fontWeight: `var(${P}-price-weight)` as any,
          // kluczowa poprawka: padding z brandingu
          padding: `var(${P}-price-py) var(${P}-price-px)`,
        }}
      >
        {nfmt(pricePln)} zł
      </span>
    </div>
  );

  const Meta = (
    <div
      className="flex gap-2"
      style={{
        justifyContent: `var(${P}-meta-justify)`,
        marginTop: `var(${P}-meta-mt)`,
      }}
    >
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
        {nfmt(area)} m²
      </span>
      {perM2 != null && (
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
          {nfmt(perM2)} zł/m²
        </span>
      )}
    </div>
  );

  // LIST
  if (view === "list") {
    return (
      <Link
        href={`/ogloszenia/${id}`}
        className={cardVars.className}
        onMouseEnter={() => onHover?.(id)}
        onMouseLeave={() => onHover?.(null)}
        style={{
          background: `var(${P}-bg)`,
          borderRadius: `var(${P}-radius)`,
          padding: `var(${P}-py) var(${P}-px)`,
          boxShadow: `var(${P}-shadow, 0 1px 1px rgba(0,0,0,.03), 0 6px 18px rgba(0,0,0,.06))`,
        }}
      >
        <div className="relative overflow-hidden" style={cardVars.imageWrapStyle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb || "/noimg.jpg"}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {Chip}
          {ImgCount}
        </div>

        <div className="p-3">
          {Title}
          {(city || region) && Address}
          {Price}
          {Meta}
        </div>
      </Link>
    );
  }

  // GRID
  return (
    <Link
      href={`/ogloszenia/${id}`}
      className={cardVars.className}
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHover?.(null)}
      style={{
        background: `var(${P}-bg)`,
        borderRadius: `var(${P}-radius)`,
        padding: `var(${P}-py) var(${P}-px)`,
        boxShadow: `var(${P}-shadow, 0 1px 1px rgba(0,0,0,.03), 0 6px 18px rgba(0,0,0,.06))`,
      }}
    >
      <div className="relative overflow-hidden" style={cardVars.imageWrapStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb || "/noimg.jpg"}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {Chip}
        {ImgCount}
      </div>

      <div className="p-3">
        {Title}
        {(city || region) && Address}
        {Price}
        {Meta}
      </div>
    </Link>
  );
}
