import { notFound } from "next/navigation";

/** API shape (wystarczy nam podzbiór) */
type ApiImage = { id?: number; url?: string; type?: "photo" | "floorplan" };
type ApiListing = {
  id: number;
  title: string;
  description?: string;
  price: number;        // grosze
  area: number;
  address_city: string;
  address_region: string;
  street?: string | null;
  lat: number | null;
  lng: number | null;
  category?: string | null;
  offer_type?: "sprzedaz" | "wynajem" | "dzierzawa";
  images?: ApiImage[];
};

async function getListing(id: string): Promise<ApiListing | null> {
  if (!id) return null;

  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  const url = `${base}/api/v1/listings/${encodeURIComponent(id)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });

    // 404 -> pokaż 404, 401/403 -> też nie wywalaj SSR
    if (res.status === 404) return null;
    if (!res.ok) {
      // przyda się do debugowania w dev
      console.warn("[listing detail] HTTP", res.status, url);
      return null;
    }

    const json = await res.json().catch(() => ({}));
    // backend bywa różny: {data: {...}} albo {...}
    const data = (json?.data && typeof json.data === "object") ? json.data : json;
    if (!data || typeof data !== "object") return null;

    return data as ApiListing;
  } catch (e) {
    console.error("[listing detail] fetch error:", e);
    return null;
  }
}

/** Next 15: params jako Promise – trzeba awaitować */
export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // <-- kluczowe; bez tego często trafiało na undefined
  const listing = await getListing(id);

  if (!listing) {
    // ładne 404 zamiast „Runtime Error”
    notFound();
  }

  // proste renderowanie – masz już swój dopieszczony widok, więc podmień w środku
  return (
    <main className="container-page py-6 md:py-8">
      <header className="mb-6 md:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {listing!.title}
          </h1>
          <p className="text-gray-600 mt-1">
            {[listing!.street, listing!.address_city, listing!.address_region].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl md:text-3xl font-extrabold">
            {(listing!.price / 100).toLocaleString("pl-PL")} zł
          </div>
          <div className="text-sm text-gray-500">
            {(listing!.price / 100 / Math.max(1, listing!.area)).toLocaleString("pl-PL")} zł/m²
          </div>
        </div>
      </header>

      {/* Tu wstawiasz swój dopieszczony layout (galeria, podsumowanie, opis, mapa...) */}
      <section className="card-modern p-5 md:p-6">
        <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100">
          {/* mini demo – pokaż pierwsze zdjęcie */}
          {listing!.images?.length ? (
            // @ts-ignore
            <img src={listing!.images[0]?.url} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="mt-6 prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: listing!.description || "" }} />
        </div>
      </section>
    </main>
  );
}
