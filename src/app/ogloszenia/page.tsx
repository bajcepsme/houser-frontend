import SearchBar from '@/components/SearchBar';
import ListingCard from '@/components/ListingCard';

type Search = { [key: string]: string | string[] | undefined };

async function getListings(searchParams: Search) {
  const city = (searchParams.city as string) || '';
  const min = (searchParams.min as string) || '';
  const max = (searchParams.max as string) || '';
  const page = (searchParams.page as string) || '1';

  const q = new URLSearchParams();
  if (city) q.set('city', city);
  if (min) q.set('price_from', String(Math.round(parseFloat(min))));
  if (max) q.set('price_to', String(Math.round(parseFloat(max))));
  q.set('per_page', '12');
  q.set('page', page);

  const api = process.env.NEXT_PUBLIC_API_URL as string;
  const res = await fetch(`${api}/api/v1/listings?${q.toString()}`, { cache: 'no-store' });
  if (!res.ok) return { items: [], meta: null };

  const payload = await res.json();

  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
    ? payload.data
    : [];

  const normalized = items.map((l: any) => ({
    ...l,
    images: (l.images || []).slice().sort((a: any, b: any) => a.order - b.order),
  }));

  const meta =
    payload?.meta ??
    (Array.isArray(payload?.links)
      ? { current_page: Number(page) || 1, last_page: Number(page) || 1 }
      : null);

  return { items: normalized, meta };
}

export default async function ListingsPage({ searchParams }: { searchParams: Search }) {
  const { items } = await getListings(searchParams);

  return (
    <main className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Ogłoszenia</h1>

      {/* Pasek wyszukiwania z podpowiedziami */}
      <div className="relative"> {/* ważne: bez overflow-hidden */}
        <SearchBar initialCity={String((searchParams as any)?.city ?? '')} />
      </div>

      {/* Lista ogłoszeń */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((l: any) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-600">
          Brak wyników dla wybranych filtrów.
        </div>
      )}
    </main>
  );
}
