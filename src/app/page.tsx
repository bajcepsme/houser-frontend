import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import ListingCard from '@/components/ListingCard';

/* ======================= DATA HELPERS ======================= */

async function fetchListings(limit = 8) {
  const base = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
  const url = `${base}/api/v1/listings?limit=${limit}`;

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

/* ======================= PAGE ======================= */

export default async function HomePage() {
  const listings = await fetchListings(12);

  // Sprzedaż: 4 szt. (grid)
  const sale = listings.slice(0, 4);

  // Wynajem: kolejne 4 szt. (list view)
  const rent = listings.slice(4, 8);

  return (
    <main className="space-y-16">
      <Hero />
      <CategoriesStrip />

      {/* SPRZEDAŻ – 4, GRID */}
      <ListingsGrid
        title="Nowe nieruchomości na sprzedaż"
        subtitle="najnowsze okazje z całej Polski"
        items={sale}
        moreHref="/ogloszenia?typ=sprzedaz"
      />

      <LocationsSection />

      {/* WYNAJEM – 4, LIST (2x2 responsywnie) */}
      <ListingsList
        title="Nowe oferty do wynajęcia"
        subtitle="sprawdź aktualne ogłoszenia wynajmu"
        items={rent}
        moreHref="/ogloszenia?typ=wynajem"
      />

      <TestimonialsSection />
      <CtaBanner />
      <BlogSection />
    </main>
  );
}

/* ======================= HERO ======================= */

function Hero() {
  return (
    <section className="relative isolate">
      <div className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero.jpg"
          alt=""
          className="w-full h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 pt-10 md:pt-16 pb-6 md:pb-10 min-h-[calc(100vh-64px)] flex flex-col">
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <Link href="/" className="hover:text-white">Ogłoszenia</Link>
          <span>/</span>
          <span className="opacity-80">Start</span>
        </div>

        <div className="mt-4 md:mt-6 max-w-3xl">
          <h1 className="text-white text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
            darmowe ogłoszenia nieruchomości
          </h1>
          <p className="text-white mt-3 text-lg">
            przeglądaj, obserwuj i bezpłatnie dodawaj oferty nieruchomości – których szukają osoby z Twojej okolicy
          </p>
        </div>

        <div className="mt-8 max-w-5xl relative z-20">
          <div className="rounded-2xl p-2 shadow-2xl ring-1 ring-white/20 backdrop-blur bg-white/10">
            <SearchBar />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ======================= KATEGORIE ======================= */

const CATEGORIES = [
  { key: 'mieszkania', label: 'Mieszkania', img: '/categories/_mieszkania.jpg', count: 419 },
  { key: 'domy', label: 'Domy', img: '/categories/_domy.jpg', count: 168 },
  { key: 'dzialki', label: 'Działki', img: '/categories/_dzialki.jpg', count: 276 },
  { key: 'garaze', label: 'Garaże', img: '/categories/_garaze.jpg', count: 3 },
  { key: 'lokale', label: 'Lokale usługowe', img: '/categories/_lokale.jpg', count: 67 },
  { key: 'hale', label: 'Hale', img: '/categories/_hale.jpg', count: 22 },
  { key: 'hotele', label: 'Hotele i pensjonaty', img: '/categories/_hotele.jpg', count: 3 },
  { key: 'palace', label: 'Pałace', img: '/categories/_palace.jpg', count: 1 },
];

function CategoriesStrip() {
  return (
    <section className="container-page">
      <div className="text-center mb-8 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold">Kategorie nieruchomości</h2>
        <p className="text-gray-600 mt-1">przeglądaj oferty wg rodzaju</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={`/kategorie/${c.key}`}
            className="snap-start shrink-0 w-[180px]"
          >
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition">
              <div className="h-24 w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <div className="font-semibold">{c.label}</div>
                <div className="text-xs text-gray-500">{c.count} ogłoszeń</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ======================= LISTINGS SEKCJE ======================= */

function ListingsGrid({
  title,
  subtitle,
  items,
  moreHref,
}: {
  title: string;
  subtitle?: string;
  items: any[];
  moreHref: string;
}) {
  return (
    <section className="container-page">
      <div className="mb-4 md:mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
          {!!subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <Link
          href={moreHref}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-white text-sm font-semibold hover:bg-brand-800"
        >
          Więcej →
        </Link>
      </div>

      {items?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((l: any) => (
            <ListingCard
              key={l.id}
              id={l.id}
              title={l.title}
              price={l.price}
              area={l.area}
              city={l.address_city}
              region={l.address_region}
              images={l.images}
              offerType={l.offer_type}
              view="grid"
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-600">
          Brak ofert do wyświetlenia.
        </div>
      )}
    </section>
  );
}

function ListingsList({
  title,
  subtitle,
  items,
  moreHref,
}: {
  title: string;
  subtitle?: string;
  items: any[];
  moreHref: string;
}) {
  return (
    <section className="container-page">
      <div className="mb-4 md:mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
          {!!subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <Link
          href={moreHref}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-white text-sm font-semibold hover:bg-brand-800"
        >
          Więcej →
        </Link>
      </div>

      {items?.length ? (
        // 2x2 responsywnie
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {items.map((l: any) => (
            <ListingCard
              key={l.id}
              id={l.id}
              title={l.title}
              price={l.price}
              area={l.area}
              city={l.address_city}
              region={l.address_region}
              images={l.images}
              offerType={l.offer_type}
              view="list"
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-600">
          Brak ofert do wyświetlenia.
        </div>
      )}
    </section>
  );
}

/* ======================= LOKALIZACJE / OPINIE / CTA / BLOG ======================= */

const LOCATIONS = [
  { key: 'warszawa', name: 'Warszawa', img: '/locations/warszawa.jpg', count: 80 },
  { key: 'krakow', name: 'Kraków', img: '/locations/krakow.jpg', count: 73 },
  { key: 'lodz', name: 'Łódź', img: '/locations/lodz.jpg', count: 23 },
  { key: 'wroclaw', name: 'Wrocław', img: '/locations/wroclaw.jpg', count: 49 },
  { key: 'poznan', name: 'Poznań', img: '/locations/poznan.jpg', count: 11 },
  { key: 'gdansk', name: 'Gdańsk', img: '/locations/gdansk.jpg', count: 7 },
  { key: 'szczecin', name: 'Szczecin', img: '/locations/szczecin.jpg', count: 9 },
  { key: 'bialystok', name: 'Białystok', img: '/locations/bialystok.jpg', count: 3 },
];

function LocationsSection() {
  return (
    <section className="container-page">
      <div className="text-center mb-8 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold">Popularne lokalizacje</h2>
        <p className="text-gray-600 mt-1">sprawdź oferty w wybranym mieście</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {LOCATIONS.map((l) => (
          <Link key={l.key} href={`/lokalizacje/${l.key}`} className="snap-start shrink-0 w-[220px]">
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition">
              <div className="h-28 w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.img} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <div className="font-semibold">{l.name}</div>
                <div className="text-xs text-gray-500">{l.count} ogłoszeń</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ======================= TESTIMONIALS ======================= */

const TESTIMONIALS = [
  {
    name: 'Alicja Szczygieł',
    role: 'agent nieruchomości',
    text:
      'Jako agent nieruchomości uważam, że Houser.pl to świetne narzędzie – oferty prezentują się nowocześnie i mają duże zasięgi.',
    avatar: '/avatars/f1.jpg',
  },
  {
    name: 'Michał Wojdenko',
    role: 'deweloper',
    text:
      'Dodawanie i zarządzanie ogłoszeniami jest banalnie proste. Dostajemy wartościowe leady, a panel jest intuicyjny.',
    avatar: '/avatars/m1.jpg',
  },
  {
    name: 'Krzysztof Zdzanowski',
    role: 'przedsiębiorca',
    text:
      'Przejrzałem mnóstwo serwisów – tu filtrowanie i mapa robią robotę. Finalnie kupiłem mieszkanie z oferty znalezionej na Houser.pl.',
    avatar: '/avatars/m2.jpg',
  },
];

function TestimonialsSection() {
  return (
    <section className="container-page">
      <div className="text-center mb-8 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold">sprawdź opinie naszych użytkowników</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <div
            key={i}
            className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.avatar} alt={t.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-brand-700">{t.role}</div>
              </div>
            </div>
            <p className="mt-3 text-gray-700 leading-relaxed">{t.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ======================= CTA BANNER ======================= */

function CtaBanner() {
  return (
    <section className="bg-brand-900">
      <div className="container-page py-10 md:py-14 text-white grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold">
            Zacznij sprzedawać i wynajmować nieruchomości z Houser.pl
          </h3>
          <p className="text-white/80 mt-2 max-w-2xl">
            Dodawaj ogłoszenia, zarządzaj ofertami i docieraj do tysięcy użytkowników z całej Polski.
          </p>
        </div>
        <Link
          href="/dodaj-ogloszenie"
          className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-brand-900 shadow-soft hover:bg-gray-50"
        >
          Rozpocznij →
        </Link>
      </div>
    </section>
  );
}

/* ======================= BLOG ======================= */

const BLOG = [
  {
    slug: 'wynajem-biura-w-polsce',
    title: 'Wynajem biura w Polsce – porównanie ofert z największych',
    date: '2025-07-24',
    category: 'Rynek nieruchomości',
    img: '/blog/b1.jpg',
  },
  {
    slug: 'ekskluzywne-nieruchomosci',
    title: 'Ekskluzywne nieruchomości – inwestycja w prestiż i przyszłość',
    date: '2025-06-09',
    category: 'Blog',
    img: '/blog/b2.jpg',
  },
  {
    slug: 'prognozy-rynku-2025',
    title: 'Prognozy na rynku nieruchomości w 2025 roku',
    date: '2025-05-29',
    category: 'Rynek nieruchomości',
    img: '/blog/b3.jpg',
  },
  {
    slug: 'jakie-rnny-najlepsze',
    title: 'Jakie rynny będą najlepsze dla Twojego domu?',
    date: '2025-02-12',
    category: 'Porady',
    img: '/blog/b4.jpg',
  },
];

function BlogSection() {
  return (
    <section className="container-page">
      <div className="mb-4 md:mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Artykuły na blogu</h2>
          <p className="text-gray-600 mt-1">najnowsze wpisy</p>
        </div>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-white text-sm font-semibold hover:bg-brand-800"
        >
          Więcej →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {BLOG.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition"
          >
            <div className="h-36 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="p-4 space-y-2">
              <div className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                {p.category}
              </div>
              <div className="font-semibold line-clamp-2">{p.title}</div>
              <div className="text-xs text-gray-500">
                {new Date(p.date).toLocaleDateString('pl-PL')}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
