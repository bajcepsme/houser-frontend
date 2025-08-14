import SearchBar from '@/components/SearchBar';
import ListingCard from '@/components/ListingCard';

async function getLatestListings() {
  const base =
    (process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      'http://127.0.0.1:8000').replace(/\/+$/, '');

  const url = `${base}/api/v1/listings?limit=8`;

  try {
    const res = await fetch(url, { cache: 'no-store', next: { revalidate: 0 } });
    if (!res.ok) return [];
    const payload = await res.json();
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
      ? payload.items
      : [];
    return items.map((l: any) => ({
      ...l,
      images: (l.images || [])
        .slice()
        .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0)),
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const listings = await getLatestListings();

  return (
    <main className="space-y-10">
      {/* HERO */}
      <section className="relative overflow-hidden unclip">
        <div className="absolute inset-0">
          <img src="/hero.jpg" alt="" className="w-full h-[420px] md:h-[560px] object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-black/10" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-16">
          <h1 className="text-white text-4xl md:text-5xl font-extrabold tracking-tight max-w-3xl leading-tight">
            Znajdź dom, który naprawdę pokochasz
          </h1>
          <p className="text-white/85 mt-3 max-w-2xl text-lg">
            Przeglądaj oferty w czasie rzeczywistym, z mapą i filtrowaniem jak w aplikacji.
          </p>

          <div className="mt-8 max-w-4xl">
            <div className="glass rounded-2xl p-2 ring-1 ring-white/20 shadow-2xl">
              <SearchBar />
            </div>
          </div>
        </div>
      </section>

      {/* NOWE OFERTY */}
      <section className="container-page">
        <div className="mb-4 md:mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">Nowe nieruchomości</h2>
          <p className="text-gray-600 mt-1">Najnowsze oferty z całej Polski</p>
        </div>

        {Array.isArray(listings) && listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {listings.map((l: any) => (
              <ListingCard
                key={l.id}
                id={l.id}
                title={l.title}
                price={l.price}
                area={l.area}
                city={l.address_city}
                region={l.address_region}
                images={l.images}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-600">
            Brak ofert do wyświetlenia.
          </div>
        )}
      </section>
    </main>
  );
}
