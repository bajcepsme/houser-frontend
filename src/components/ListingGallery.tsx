"use client";

import Image from "next/image";

type Props = {
  items: Array<{
    id: string;
    title: string;
    address?: string;
    city?: string;
    region?: string;
    price_label: string;
    price_per?: string | null;
    area_m2?: number | null;
    price_m2_label?: string | null;
    images?: string[];
  }>;
  mode: "grid" | "list";
  emptyLabel?: string;
};

export default function ListingGallery({ items, mode, emptyLabel }: Props) {
  if (!items || items.length === 0) {
    return <div className="empty">{emptyLabel || "Brak danych."}</div>;
  }

  if (mode === "grid") {
    return (
      <div className="lg:grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
        {items.map((it) => (
          <article
            key={it.id}
            className="lc-card"
            style={{
              borderRadius: "var(--lc-grid-radius)",
              background: "var(--lc-grid-bg)",
              boxShadow: "var(--lc-grid-card-shadow, 0 1px 1px rgba(0,0,0,.03), 0 6px 18px rgba(0,0,0,.06))",
              border: "var(--lc-grid-card-outline)",
            }}
          >
            <div className="lc-imgwrap" style={{ aspectRatio: "var(--lc-grid-img-aspect, 16/9)" } as any}>
              <Image
                src={(it.images && it.images[0]) || "/images/placeholders/cover.jpg"}
                alt=""
                fill
                sizes="(max-width:768px) 100vw, 25vw"
                className="lc-img"
              />
              {!!it.price_per && (
                <div className="lc-chip lc-top"
                     style={{
                       justifyContent: "var(--lc-grid-chip-justify)",
                     }}>
                  <span
                    style={{
                      background: "var(--lc-grid-chip-bg)",
                      color: "var(--lc-grid-chip-color)",
                      border: "var(--lc-grid-chip-border)",
                      fontSize: "var(--lc-grid-chip-fs)",
                      padding: "var(--lc-grid-chip-py) var(--lc-grid-chip-px)",
                      borderRadius: "var(--lc-grid-chip-radius)",
                    }}
                  >
                    {it.price_per}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3">
              <h4
                className="line-clamp-2"
                style={{
                  fontSize: "var(--lc-grid-title-size)",
                  fontWeight: "var(--lc-grid-title-weight)",
                  textAlign: "var(--lc-grid-title-align)" as any,
                  color: "var(--lc-grid-title-color, currentColor)",
                  marginBottom: "var(--lc-grid-title-mb)",
                }}
              >
                {it.title}
              </h4>

              <div
                className="mt-1 text-[13px] text-gray-600"
                style={{
                  fontSize: "var(--lc-grid-address-size)",
                  fontWeight: "var(--lc-grid-address-weight)",
                  color: "var(--lc-grid-address-color)",
                  marginTop: "var(--lc-grid-address-mt)",
                }}
              >
                {it.address || [it.city, it.region].filter(Boolean).join(", ")}
              </div>

              <div className="mt-2 flex"
                   style={{ justifyContent: "var(--lc-grid-price-justify)" }}>
                <span
                  className="inline-flex font-semibold"
                  style={{
                    background: "var(--lc-grid-price-bg)",
                    color: "var(--lc-grid-price-color)",
                    fontSize: "var(--lc-grid-price-size)",
                    fontWeight: "var(--lc-grid-price-weight)",
                    padding: "var(--lc-grid-price-py) var(--lc-grid-price-px)",
                    borderRadius: "var(--lc-grid-price-radius)",
                  }}
                >
                  {it.price_label}
                </span>
              </div>

              <div className="mt-2 flex gap-2"
                   style={{ justifyContent: "var(--lc-grid-meta-justify)", marginTop: "var(--lc-grid-meta-mt)" }}>
                {it.area_m2 ? (
                  <span className="lc-meta">
                    {it.area_m2} m²
                  </span>
                ) : null}
                {it.price_m2_label ? (
                  <span className="lc-meta">
                    {it.price_m2_label}
                  </span>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  // LIST
  return (
    <div className="space-y-4">
      {items.map((it) => (
        <article
          key={it.id}
          className="grid grid-cols-[160px_1fr] gap-3 lc-card"
          style={{
            borderRadius: "var(--lc-list-radius)",
            background: "var(--lc-list-bg)",
            boxShadow: "var(--lc-list-card-shadow, 0 1px 1px rgba(0,0,0,.03), 0 6px 18px rgba(0,0,0,.06))",
            border: "var(--lc-list-card-outline)",
          }}
        >
          <div className="relative overflow-hidden" style={{ aspectRatio: "var(--lc-list-img-aspect, 16/9)" } as any}>
            <Image
              src={(it.images && it.images[0]) || "/images/placeholders/cover.jpg"}
              alt=""
              fill
              sizes="(max-width:768px) 40vw, 18vw"
              className="lc-img"
            />
          </div>
          <div className="p-3">
            <h4
              className="line-clamp-2"
              style={{
                fontSize: "var(--lc-list-title-size)",
                fontWeight: "var(--lc-list-title-weight)",
                textAlign: "var(--lc-list-title-align)" as any,
                color: "var(--lc-list-title-color, currentColor)",
                marginBottom: "var(--lc-list-title-mb)",
              }}
            >
              {it.title}
            </h4>

            <div
              className="mt-1 text-[13px] text-gray-600"
              style={{
                fontSize: "var(--lc-list-address-size)",
                fontWeight: "var(--lc-list-address-weight)",
                color: "var(--lc-list-address-color)",
                marginTop: "var(--lc-list-address-mt)",
              }}
            >
              {it.address || [it.city, it.region].filter(Boolean).join(", ")}
            </div>

            <div className="mt-2 flex"
                 style={{ justifyContent: "var(--lc-list-price-justify)" }}>
              <span
                className="inline-flex font-semibold"
                style={{
                  background: "var(--lc-list-price-bg)",
                  color: "var(--lc-list-price-color)",
                  fontSize: "var(--lc-list-price-size)",
                  fontWeight: "var(--lc-list-price-weight)",
                  padding: "var(--lc-list-price-py) var(--lc-list-price-px)",
                  borderRadius: "var(--lc-list-price-radius)",
                }}
              >
                {it.price_label}
              </span>
            </div>

            <div className="mt-2 flex gap-2"
                 style={{ justifyContent: "var(--lc-list-meta-justify)", marginTop: "var(--lc-list-meta-mt)" }}>
              {it.area_m2 ? (
                <span className="lc-meta">{it.area_m2} m²</span>
              ) : null}
              {it.price_m2_label ? (
                <span className="lc-meta">{it.price_m2_label}</span>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
