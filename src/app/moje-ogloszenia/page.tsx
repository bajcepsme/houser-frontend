'use client';

import { useEffect, useMemo, useState } from 'react';
// ZMIANA: Usunięto nieużywany import `dynamic`
import Image from 'next/image';
import Link from 'next/link';
import { Pencil, Trash2, Star, Grid, List } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ZMIANA: Dodano przykładowe definicje typów dla czytelności i bezpieczeństwa
// (Zakładam, że istnieją gdzieś w projekcie, np. w pliku types.d.ts)
type ImageT = {
  id: number;
  url: string;
  order: number;
};

type Listing = {
  id: number;
  title: string;
  price: number | null;
  address_city: string | null;
  address_region: string | null;
  lat: number | null;
  lng: number | null;
  images: ImageT[];
  created_at: string | null;
  area: number | null;
};

// Sugestia: Zdefiniuj typ użytkownika, aby uniknąć `(user as any)`
// type AppUser = {
//   id: number;
//   name: string;
//   email: string;
//   avatar?: string | null;
//   role?: string;
//   phone?: string;
//   bio?: string;
// }
// a w `useAuth` zwracaj: `user: AppUser | null;`

const PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>
  <defs>
    <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
      <stop offset='0%' stop-color='#e2e8f0'/>
      <stop offset='100%' stop-color='#f1f5f9'/>
    </linearGradient>
  </defs>
  <rect width='100%' height='100%' fill='url(#g)'/>
  <g fill='#94a3b8' font-family='Arial, Helvetica, sans-serif' font-size='22'>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'>Brak zdjęcia</text>
  </g>
</svg>
`)}`;

function makeImageUrl(u?: string | null) {
  if (!u) return PLACEHOLDER;
  if (/^https?:\/\//i.test(u)) return u;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || '';
  const path = u.replace(/^\/+/, '');
  return `${base}/${path}`;
}

function formatPrice(plnCents?: number | null) {
  if (plnCents == null) return '—';
  return `${(plnCents / 100).toLocaleString('pl-PL')} PLN`;
}

export default function MyListingsShowcasePage() {
  const { user, token, isLoading } = useAuth();

  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Filtry + widok
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [priceMin, setPriceMin] = useState<number | ''>('');
  const [priceMax, setPriceMax] = useState<number | ''>('');
  const [areaMin, setAreaMin] = useState<number | ''>('');
  const [areaMax, setAreaMax] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'price_asc' | 'price_desc'>(
    'date_desc'
  );

  useEffect(() => {
    if (isLoading) return;
    if (!user || !token) return;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/my-listings`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Nie udało się pobrać ogłoszeń');

        const payload = await res.json();
        const data = Array.isArray(payload?.data) ? payload.data : payload;

        const normalized: Listing[] = (data || []).map((l: any, idx: number) => ({
          id: Number(l.id),
          title: String(l.title ?? `Ogłoszenie #${idx + 1}`),
          price: typeof l.price === 'number' ? l.price : Number(l.price ?? 0),
          address_city: l.address_city ?? null,
          address_region: l.address_region ?? null,
          lat: l?.lat ?? l?.latitude ?? l?.geo_lat ?? null,
          lng: l?.lng ?? l?.longitude ?? l?.geo_lng ?? null,
          images: Array.isArray(l.images)
            ? l.images
                .map((img: any, i: number) => ({
                  id: Number(img?.id ?? i),
                  url:
                    img?.url ??
                    img?.full_url ??
                    img?.image_url ??
                    img?.original_url ??
                    img?.path ??
                    img?.file_path ??
                    img?.filename ??
                    '',
                  order: Number(img?.order ?? i + 1),
                }))
                .sort((a: ImageT, b: ImageT) => (a.order ?? 0) - (b.order ?? 0))
            : [],
          created_at: l?.created_at ?? null,
          area: typeof l?.area === 'number' ? l.area : Number(l?.area ?? 0),
        }));

        setItems(normalized);
      } catch (e: any) {
        setErr(e.message || 'Błąd');
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoading, user, token]);

  // ZMIANA: Usunięto całą sekcję `useMemo` dla `pins`, ponieważ nie jest już potrzebna.

  const filtered = useMemo(() => {
    let arr = [...items]; // Lepszy sposób na stworzenie kopii

    // data
    if (dateFrom) arr = arr.filter((x) => !x.created_at || x.created_at >= dateFrom);
    if (dateTo) arr = arr.filter((x) => !x.created_at || x.created_at <= dateTo);

    // cena (w groszach)
    if (priceMin !== '') arr = arr.filter((x) => (x.price ?? 0) >= priceMin);
    if (priceMax !== '') arr = arr.filter((x) => (x.price ?? 0) <= priceMax);

    // metraż
    if (areaMin !== '') arr = arr.filter((x) => (x.area ?? 0) >= areaMin);
    if (areaMax !== '') arr = arr.filter((x) => (x.area ?? 0) <= areaMax);

    // sort
    arr.sort((a, b) => {
      if (sortBy === 'date_desc') return (b.created_at || '').localeCompare(a.created_at || '');
      if (sortBy === 'date_asc') return (a.created_at || '').localeCompare(b.created_at || '');
      if (sortBy === 'price_asc') return (a.price ?? 0) - (b.price ?? 0);
      if (sortBy === 'price_desc') return (b.price ?? 0) - (a.price ?? 0);
      return 0;
    });

    return arr;
  }, [items, dateFrom, dateTo, priceMin, priceMax, areaMin, areaMax, sortBy]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm('Na pewno usunąć to ogłoszenie?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/listings/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Błąd usuwania');
      setItems((s) => s.filter((x) => x.id !== id));
    } catch (e) {
      alert('Nie udało się usunąć ogłoszenia.');
    }
  };

  const ActionButtons = ({ id }: { id: number }) => (
    <div className="flex items-center gap-2">
      <Link
        href={`/ogloszenia/${id}/edytuj`}
        title="Edytuj"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white shadow hover:bg-blue-600 transition active:scale-95"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        title="Promuj"
        onClick={() => alert('Tu podłącz akcję promowania 😉')}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-white shadow hover:bg-amber-600 transition active:scale-95"
      >
        <Star className="h-4 w-4" />
      </button>
      <button
        title="Usuń"
        onClick={() => handleDelete(id)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white shadow hover:bg-rose-600 transition active:scale-95"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  if (isLoading) return <main className="container-page py-10">Ładowanie…</main>;
  if (!user) return null;

  const avatar = (user as any)?.avatar || null;
  const role = (user as any)?.role || 'Osoba Prywatna';
  const phone = (user as any)?.phone || (user as any)?.phone_number || '';
  const email = user.email ?? '';

  return (
    <main className="container-page py-8 md:py-16 space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-modern p-5 md:p-8">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-black/5 shrink-0">
              <Image
                src={makeImageUrl(avatar)}
                alt={user?.name || 'Avatar'}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold mb-1">{user?.name || 'Użytkownik'}</h1>
              <div className="text-sm text-gray-600 mb-4 capitalize">{role}</div>

              <div className="space-y-1 text-sm text-gray-700">
                {((user as any)?.bio as string) ||
                  'Tu może pojawić się Twoje bio – dodaj je w ustawieniach profilu.'}
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="input-group">
                  <input className="input-modern input-readonly" value={phone || 'Brak'} readOnly />
                  <span className="input-suffix">Telefon</span>
                </div>
                <div className="input-group">
                  <input className="input-modern input-readonly" value={email || 'Brak'} readOnly />
                  <span className="input-suffix">E-mail</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-gray-200/70 p-4">
                  <div className="text-xs text-gray-500 mb-1">Ogłoszenia</div>
                  <div className="text-2xl font-bold">{items.length}</div>
                </div>
                <div className="rounded-2xl border border-gray-200/70 p-4">
                  <div className="text-xs text-gray-500 mb-1">Z lokalizacją</div>
                  <div className="text-2xl font-bold">
                    {/* ZMIANA: Logika liczenia przeniesiona z `pins` na `items` */}
                    {items.filter(it => Number.isFinite(it.lat) && Number.isFinite(it.lng)).length}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200/70 p-4">
                  <div className="text-xs text-gray-500 mb-1">Śr. cena</div>
                  <div className="text-2xl font-bold">
                    {items.length
                      ? (
                          items.reduce((a, b) => a + (b.price || 0), 0) /
                          items.length /
                          100
                        ).toLocaleString('pl-PL') + ' PLN'
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="card-modern p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="inline-flex rounded-full border border-gray-200 p-1 bg-white">
            <button
              onClick={() => setView('grid')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition ${
                view === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-800 hover:bg-gray-50'
              }`}
              title="Siatka"
            >
              <Grid className="h-4 w-4" />
              <span className="hidden sm:inline">Siatka</span>
            </button>
            <button
              onClick={() => setView('list')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition ${
                view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-800 hover:bg-gray-50'
              }`}
              title="Lista"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-gray-600">Sortuj wg</label>
            <select
              className="input-modern"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="date_desc">Data ↓</option>
              <option value="date_asc">Data ↑</option>
              <option value="price_desc">Cena ↓</option>
              <option value="price_asc">Cena ↑</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="number"
            className="input-modern"
            placeholder="Cena od (PLN)"
            // ZMIANA: Wyświetlaj wartość w PLN, a nie w groszach
            value={priceMin === '' ? '' : priceMin / 100}
            onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) * 100 : '')}
          />
          <input
            type="number"
            className="input-modern"
            placeholder="Cena do (PLN)"
            // ZMIANA: Wyświetlaj wartość w PLN, a nie w groszach
            value={priceMax === '' ? '' : priceMax / 100}
            onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) * 100 : '')}
          />
          <input
            type="number"
            className="input-modern"
            placeholder="Pow. od (m²)"
            value={areaMin}
            onChange={(e) => setAreaMin(e.target.value ? Number(e.target.value) : '')}
          />
          <input
            type="number"
            className="input-modern"
            placeholder="Pow. do (m²)"
            value={areaMax}
            onChange={(e) => setAreaMax(e.target.value ? Number(e.target.value) : '')}
          />
          <input
            className="input-modern"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            className="input-modern"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-sm text-gray-600">Wyniki: {filtered.length} / {items.length}</div>

        {view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((it) => {
              const img = makeImageUrl(it.images?.[0]?.url ?? null);
              return (
                <div key={it.id} className="card-modern overflow-hidden">
                  <Link href={`/ogloszenia/${it.id}`} className="block">
                    <div className="relative w-full aspect-[4/3] bg-gray-100">
                      <Image
                        src={img}
                        alt={it.title}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      />
                    </div>
                  </Link>
                  <div className="p-4 space-y-2">
                    <Link
                      href={`/ogloszenia/${it.id}`}
                      className="font-semibold line-clamp-1 hover:underline"
                    >
                      {it.title}
                    </Link>
                    <div className="text-blue-600 font-bold">{formatPrice(it.price)}</div>
                    <div className="text-sm text-gray-600 line-clamp-1">
                      {[it.address_city, it.address_region].filter(Boolean).join(', ')}
                    </div>
                    <div className="pt-2 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {it.area ? `${it.area} m²` : '—'}
                      </div>
                      <ActionButtons id={it.id} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'list' && (
          <div className="space-y-3">
            {filtered.map((it) => {
              const img = makeImageUrl(it.images?.[0]?.url ?? null);
              return (
                <div
                  key={it.id}
                  className="card-modern p-3 md:p-4 flex items-stretch gap-4"
                >
                  <Link href={`/ogloszenia/${it.id}`} className="relative w-32 h-24 md:w-48 md:h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <Image src={img} alt={it.title} fill className="object-cover" />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/ogloszenia/${it.id}`}
                        className="font-semibold text-lg hover:underline line-clamp-1"
                      >
                        {it.title}
                      </Link>
                      <ActionButtons id={it.id} />
                    </div>

                    <div className="text-blue-600 font-bold mt-1">{formatPrice(it.price)}</div>
                    <div className="text-sm text-gray-600 line-clamp-1">
                      {[it.address_city, it.address_region].filter(Boolean).join(', ')}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {it.area ? `${it.area} m²` : '—'} • ID: #{it.id}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}