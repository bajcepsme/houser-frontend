// src/app/page.tsx
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import ListingCard from '@/components/ListingCard';

/* ======================= DATA HELPERS ======================= */

/** Absolutny URL do API (dla ścieżek względnych) */
function toAbsoluteApiUrl(path?: string | null): string {
  if (!path) return '';
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
  if (/^(data:|blob:|https?:\/\/)/i.test(path)) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${apiBase}${p}`;
}

/** Avatar: normalizacja różnych formatów na absolutny URL API */
function resolveApiAvatarUrl(raw?: string | null): string {
  if (!raw) return '';
  let s = String(raw).trim();
  if (!s) return '';
  // absolutne / data / blob — bez zmian
  if (/^(data:|blob:|https?:\/\/)/i.test(s)) return s;

  // usuń wiodące slashe
  s = s.replace(/^\/+/, '');

  // najczęstszy przypadek z backendu: "avatars/xyz.jpg" -> "storage/avatars/xyz.jpg"
  if (s.startsWith('avatars/')) s = `storage/${s}`;
  // jeśli już jest "storage/..." zostaw
  // jeżeli backend zwróci coś innego (np. users/...), też zadziała jako /{cokolwiek}
  return toAbsoluteApiUrl(`/${s}`);
}

/** Wybór pierwszego sensownego pola z rekordu ogłoszenia zawierającego avatar właściciela */
function pickOwnerAvatar(listing: any): string {
  const candidates = [
    listing.owner_avatar_url,
    listing.owner_avatar,

    listing.owner?.avatar_url,
    listing.owner?.avatar,
    listing.owner?.photo_url,

    listing.user?.avatar_url,
    listing.user?.avatar,
    listing.user?.photo_url,

    listing.created_by?.avatar_url,
    listing.created_by?.avatar,
  ];

  const first = candidates.find((v) => typeof v === 'string' && v.trim().length > 0);
  return resolveApiAvatarUrl(first);
}

/** Stabilne formatowanie daty (UTC), żeby nie powodować różnic SSR/CSR */
function formatDateUTC(iso: string) {
  const d = iso.length <= 10 ? new Date(`${iso}T00:00:00Z`) : new Date(iso);
  return new Intl.DateTimeFormat('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(d);
}

/** Pobranie ogłoszeń i mapowanie pól na to czego oczekuje ListingCard */
async function fetchListings({ offer_type, limit }: { offer_type: 'sprzedaz' | 'wynajem'; limit: number }) {
  const base = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
  const url = `${base}/api/v1/listings?limit=${limit}&offer_type=${offer_type}`;

  try {
    const res = await fetch(url, { cache: 'no-store', next: { revalidate: 0 } });
    if (!res.ok) return [];
    const payload = await res.json();
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

    return items.map((l: any) => {
      // avatar właściciela → absolutny URL
      const avatar = pickOwnerAvatar(l);

      // ścieżka do profilu właściciela – jeśli mamy slug lub id
      const slug = l.owner?.slug || l.user?.slug;
      const ownerId =
  l.owner_id ?? l.user_id ?? l.created_by_id ??
  l.owner?.id ?? l.user?.id ?? l.created_by?.id ?? null;
      const owner_profile_href = slug ? `/u/${slug}` : ownerId ? `/u/${ownerId}` : '';

      return {
        ...l,
        images: (l.images || [])
          .slice()
          .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0))
          .map((img: any) => ({ ...img, url: toAbsoluteApiUrl(img.url) })),
        owner_avatar_url: avatar,
        owner_profile_href,
        ownerId,                         // <-- DODANE
      };
    });
  } catch {
    return [];
  }
}

/* ======================= PAGE (DOMYŚLNY EKSPORT) ======================= */

export default async function Page() {
  const [saleListings, rentListings] = await Promise.all([
    fetchListings({ offer_type: 'sprzedaz', limit: 4 }),
    fetchListings({ offer_type: 'wynajem', limit: 4 }),
  ]);

  return (
    <main className="space-y-16">
      <Hero />
      <CategoriesStrip />

      <ListingsGrid
        title="Nowe nieruchomości na sprzedaż"
        subtitle="najnowsze okazje z całej Polski"
        items={saleListings}
        moreHref="/ogloszenia?typ=sprzedaz"
      />

      <LocationsSection />

      <ListingsList
        title="Nowe oferty do wynajęcia"
        subtitle="sprawdź aktualne ogłoszenia wynajmu"
        items={rentListings}
        moreHref="/ogloszenia?typ=wynajem"
      />

      <TestimonialsSection />
      <CtaBanner />
      <BlogSection formatDate={formatDateUTC} />
    </main>
  );
}

/* ======================= HERO ======================= */

function Hero() {
  return (
    <section className="relative isolate">
      <div className="absolute inset-0 overflow-hidden">
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

/* ======================= WSPÓLNE: UNSPLASH + CSS FALLBACK ======================= */

const unsplash = (q: string, w = 1200, h = 800, sig = 1) =>
  `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(q)}&sig=${sig}`;

function bgWithFallback(primaryUrls: string[], fallbackUrl: string) {
  const parts = [...primaryUrls.map((u) => `url("${u}")`), `url("${fallbackUrl}")`];
  return parts.join(', ');
}

/* ======================= KATEGORIE – równe kafle (16:9) ======================= */

type Category = {
  key: string;
  label: string;
  fallback: string;
  queries: string[];
  count: number;
};

const CATEGORIES: Category[] = [
  { key: 'mieszkania', label: 'Mieszkania',           fallback: '/categories/_mieszkania.jpg', queries: ['apartment interior modern', 'minimal living room'], count: 419 },
  { key: 'domy',       label: 'Domy',                 fallback: '/categories/_domy.jpg',       queries: ['modern house architecture', 'scandinavian house exterior'], count: 168 },
  { key: 'dzialki',    label: 'Działki',              fallback: '/categories/_dzialki.jpg',    queries: ['land plot meadow', 'green field acreage'], count: 276 },
  { key: 'garaze',     label: 'Garaże',               fallback: '/categories/_garaze.jpg',     queries: ['garage parking storage', 'garage doors exterior'], count: 3 },
  { key: 'lokale',     label: 'Lokale usługowe',      fallback: '/categories/_lokale.jpg',     queries: ['retail storefront interior', 'office workspace interior'], count: 67 },
  { key: 'hale',       label: 'Hale',                 fallback: '/categories/_hale.jpg',       queries: ['warehouse industrial logistics', 'warehouse interior storage'], count: 22 },
  { key: 'hotele',     label: 'Hotele i pensjonaty',  fallback: '/categories/_hotele.jpg',     queries: ['hotel lobby resort', 'boutique hotel interior'], count: 3 },
  { key: 'palace',     label: 'Pałace',               fallback: '/categories/_palace.jpg',     queries: ['palace chateau castle', 'manor estate classic'], count: 1 },
];

function CategoryTile({ c }: { c: Category }) {
  const urls = [unsplash(c.queries[0], 1200, 800, 1), unsplash(c.queries[1] || c.queries[0], 1200, 800, 2)];
  return (
    <Link
      href={`/kategorie/${c.key}`}
      className="relative overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition"
      aria-label={`Przeglądaj kategorię: ${c.label}`}
    >
      <div className="aspect-[16/9]" />
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: bgWithFallback(urls, c.fallback) }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
      <div className="absolute left-3 right-3 bottom-3 flex items-end justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-1.5 backdrop-blur">
          <span className="text-sm font-semibold text-gray-900">{c.label}</span>
        </div>
        <div className="rounded-xl bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
          {c.count} ogłoszeń
        </div>
      </div>
    </Link>
  );
}

function CategoriesStrip() {
  return (
    <section className="container-page">
      <div className="text-center mb-8 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold">Kategorie nieruchomości</h2>
        <p className="text-gray-600 mt-1">przeglądaj oferty wg rodzaju</p>
      </div>

      <div className="-mx-4 px-4 md:hidden">
        <div className="grid grid-flow-col auto-cols-[78%] sm:auto-cols-[60%] gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {CATEGORIES.map((c) => (
            <div key={c.key} className="snap-start">
              <CategoryTile c={c} />
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {CATEGORIES.map((c) => (
          <CategoryTile c={c} key={c.key} />
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
              ownerAvatarUrl={l.owner_avatar_url}
              ownerProfileHref={l.owner_profile_href}
              ownerId={l.owner?.id || l.user?.id || l.user_id || l.owner_id || l.created_by_id}
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
              ownerAvatarUrl={l.owner_avatar_url}
              ownerProfileHref={l.owner_profile_href}
              ownerId={l.owner?.id || l.user?.id || l.user_id || l.owner_id || l.created_by_id}
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

/* ======================= LOKALIZACJE ======================= */

type LocationT = {
  key: string;
  name: string;
  fallback: string;
  queries: string[];
  count: number;
};

const LOCATIONS: LocationT[] = [
  { key: 'warszawa',  name: 'Warszawa',  fallback: '/locations/warszawa.jpg',  queries: ['warsaw skyline poland', 'warsaw old town'], count: 80 },
  { key: 'krakow',    name: 'Kraków',    fallback: '/locations/krakow.jpg',    queries: ['krakow old town poland', 'krakow main square'], count: 73 },
  { key: 'lodz',      name: 'Łódź',      fallback: '/locations/lodz.jpg',      queries: ['lodz architecture poland', 'lodz piotrkowska'], count: 23 },
  { key: 'wroclaw',   name: 'Wrocław',   fallback: '/locations/wroclaw.jpg',   queries: ['wroclaw bridge poland', 'wroclaw old town'], count: 49 },
  { key: 'poznan',    name: 'Poznań',    fallback: '/locations/poznan.jpg',    queries: ['poznan old town poland', 'poznan stary rynek'], count: 11 },
  { key: 'gdansk',    name: 'Gdańsk',    fallback: '/locations/gdansk.jpg',    queries: ['gdansk harbor poland', 'gdansk old town'], count: 7 },
  { key: 'szczecin',  name: 'Szczecin',  fallback: '/locations/szczecin.jpg',  queries: ['szczecin city poland', 'szczecin waly chrobrego'], count: 9 },
  { key: 'bialystok', name: 'Białystok', fallback: '/locations/bialystok.jpg', queries: ['bialystok city poland', 'bialystok park'], count: 3 },
];

function LocationTile({ l }: { l: LocationT }) {
  const urls = [unsplash(l.queries[0], 1200, 800, 1), unsplash(l.queries[1] || l.queries[0], 1200, 800, 2)];
  return (
    <Link
      href={`/lokalizacje/${l.key}`}
      className="relative overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition"
      aria-label={`Przeglądaj oferty: ${l.name}`}
    >
      <div className="aspect-[16/9]" />
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: bgWithFallback(urls, l.fallback) }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
      <div className="absolute left-4 right-4 bottom-4 flex items-center justify-between">
        <div className="rounded-xl bg-white/90 px-3 py-1.5 text-sm font-semibold text-gray-900 backdrop-blur">
          {l.name}
        </div>
        <div className="rounded-xl bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
          {l.count} ogłoszeń
        </div>
      </div>
    </Link>
  );
}

function LocationsSection() {
  return (
    <section className="container-page">
      <div className="text-center mb-8 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold">Popularne lokalizacje</h2>
      </div>

      <div className="-mx-4 px-4 md:hidden">
        <div className="grid grid-flow-col auto-cols-[78%] sm:auto-cols-[60%] gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {LOCATIONS.map((l) => (
            <div key={l.key} className="snap-start">
              <LocationTile l={l} />
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {LOCATIONS.map((l) => (
          <LocationTile l={l} key={l.key} />
        ))}
      </div>
    </section>
  );
}

/* ======================= TESTIMONIALS / CTA / BLOG ======================= */

const TESTIMONIALS = [
  { name: 'Alicja Szczygieł', role: 'agent nieruchomości', text: 'Jako agent nieruchomości uważam, że Houser.pl to świetne narzędzie – oferty prezentują się nowocześnie i mają duże zasięgi.', avatar: '/avatars/f1.jpg' },
  { name: 'Michał Wojdenko', role: 'deweloper', text: 'Dodawanie i zarządzanie ogłoszeniami jest banalnie proste. Dostajemy wartościowe leady, a panel jest intuicyjny.', avatar: '/avatars/m1.jpg' },
  { name: 'Krzysztof Zdzanowski', role: 'przedsiębiorca', text: 'Przejrzałem mnóstwo serwisów – tu filtrowanie i mapa robią robotę. Finalnie kupiłem mieszkanie z oferty znalezionej na Houser.pl.', avatar: '/avatars/m2.jpg' },
];

function TestimonialsSection() {
  return (
    <section className="container-page">
      <div className="text-center mb-8 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold">sprawdź opinie naszych użytkowników</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
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

function CtaBanner() {
  return (
    <section className="bg-brand-900">
      <div className="container-page py-10 md:py-14 text-white grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold">Zacznij sprzedawać i wynajmować nieruchomości z Houser.pl</h3>
          <p className="text-white/80 mt-2 max-w-2xl">Dodawaj ogłoszenia, zarządzaj ofertami i docieraj do tysięcy użytkowników z całej Polski.</p>
        </div>
        <Link href="/dodaj-ogloszenie" className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-brand-900 shadow-soft hover:bg-gray-50">
          Rozpocznij →
        </Link>
      </div>
    </section>
  );
}

const BLOG = [
  { slug: 'wynajem-biura-w-polsce', title: 'Wynajem biura w Polsce – porównanie ofert z największych', date: '2025-07-24', category: 'Rynek nieruchomości', img: '/blog/b1.jpg' },
  { slug: 'ekskluzywne-nieruchomosci', title: 'Ekskluzywne nieruchomości – inwestycja w prestiż i przyszłość', date: '2025-06-09', category: 'Blog', img: '/blog/b2.jpg' },
  { slug: 'prognozy-rynku-2025', title: 'Prognozy na rynku nieruchomości w 2025 roku', date: '2025-05-29', category: 'Rynek nieruchomości', img: '/blog/b3.jpg' },
  { slug: 'jakie-rnny-najlepsze', title: 'Jakie rynny będą najlepsze dla Twojego domu?', date: '2025-02-12', category: 'Porady', img: '/blog/b4.jpg' },
];

function BlogSection({ formatDate }: { formatDate: (d: string) => string }) {
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
              <img src={p.img} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="p-4 space-y-2">
              <div className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                {p.category}
              </div>
              <div className="font-semibold line-clamp-2">{p.title}</div>
              <div className="text-xs text-gray-500">
                {formatDate(p.date)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
