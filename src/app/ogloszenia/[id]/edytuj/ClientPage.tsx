'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuth } from '@/contexts/AuthContext';

import CategorySelect from '@/app/dodaj-ogloszenie/components/CategorySelect';
import OfferTypeSelect from '@/app/dodaj-ogloszenie/components/OfferTypeSelect';
import LocationPicker from '@/app/dodaj-ogloszenie/components/LocationPicker';
import ImageUploader from '@/components/ImageUploader';
import { NearbyPicker, MediaPicker } from '@/app/dodaj-ogloszenie/components/Amenities';
import { useListingAbilities } from '@/hooks/useListingAbilities';


/* ===== typy ===== */
type OfferType = 'sprzedaz' | 'wynajem' | 'dzierzawa';

type ApiImage = {
  id: number;
  url: string;
  order: number;
  type?: 'photo' | 'floorplan';
};

type GalleryItem = File | ApiImage;

type LoadedListing = {
  id: number;
  title: string;
  description: string;
  price: number; // grosze
  area: number;
  address_city: string;
  address_region: string;
  street?: string | null;
  lat: number | null;
  lng: number | null;
  category?: string | null;
  offer_type: OfferType;
  youtube_url?: string | null;
  surroundings?: Record<string, boolean>;
  media?: Record<string, boolean>;
  details?: Record<string, string | number>;
  images?: ApiImage[] | Array<any>;
};

/* ===== helpers ===== */
const onlyDigits = (s: string) => (s || '').replace(/\D+/g, '');
const withThousandsDots = (digits: string) =>
  (digits || '').replace(/^0+/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function formatDigits(s: string) {
  return withThousandsDots(onlyDigits(s));
}
function unformatToNumber(s: string) {
  const d = onlyDigits(s);
  return d ? Number(d) : 0;
}

// aliasy, żeby działały obecne wywołania w inputach
const formatPriceInput = (s: string) => formatDigits(s);
const formatAreaInput  = (s: string) => formatDigits(s);

// (opcjonalnie) ładny format do podsumowania: 785 000 zł (wąska spacja)
const formatPriceDisplay = (s: string) => {
  const d = onlyDigits(s);
  return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F') + ' zł' : '—';
};

/** Pozwalamy tylko na <b>, <i>, <u>, <br> */
function sanitizeDescription(html: string): string {
  if (typeof window === 'undefined') return html;
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  const walk = (node: Node) => {
    const el = node as HTMLElement;
    if (node.nodeType === 1) {
      const tag = el.tagName.toLowerCase();
      if (!['b', 'i', 'u', 'br'].includes(tag)) {
        const txt = document.createTextNode(el.textContent || '');
        el.replaceWith(txt);
        return;
      }
      for (const attr of Array.from(el.attributes)) {
        el.removeAttribute(attr.name);
      }
    }
    node.childNodes.forEach(walk);
  };

  tmp.childNodes.forEach(walk);
  return tmp.innerHTML.trim();
}

/* ===== stałe ===== */
const AROUND_DEFAULT: Record<string, boolean> = {
  centrum: false, szkola: false, sklep: false, park: false, przystanek: false,
  apteka: false, basen: false, przychodnia: false, poczta: false,
};

const MEDIA_DEFAULT: Record<string, boolean> = {
  gaz: false, prad: false, woda: false, kanalizacja: false, sila: false, internet: false,
};

const THIS_YEAR = new Date().getFullYear();

/* ===== drobne UI helpers ===== */
function FieldWithUnit({
  label, unit, value, onChange, placeholder = '', inputMode = 'numeric', invalid, error
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  invalid?: boolean;
  error?: string | null;
}) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className={`flex items-center rounded-xl border overflow-hidden ${invalid ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-300'}`}>
        <input
          type="text"
          inputMode={inputMode}
          className="input-modern border-0 flex-1"
          placeholder={placeholder}
          value={value}
          aria-invalid={!!invalid}
          onChange={(e) => onChange(formatDigits(e.target.value))}
        />
        <span className="px-3 bg-gray-100 text-gray-600 whitespace-nowrap">{unit}</span>
      </div>
      {!!error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

/* ===== strona ===== */
export default function ClientPage({ id }: { id: string }) {
  const { user, isLoading } = useAuthGuard();
  const { token } = useAuth();
  const router = useRouter();
  const { abilities, loading: abilitiesLoading } = useListingAbilities(id);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
  const apiOrigin = apiBase ? new URL(apiBase).origin : '';

  const [loading, setLoading] = React.useState(true);
  const [step, setStep] = React.useState<1 | 2>(1);
  const [message, setMessage] = React.useState('');

  const [category, setCategory] = React.useState('Mieszkania');
  const [offerType, setOfferType] = React.useState<OfferType>('sprzedaz');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [area, setArea] = React.useState('');
  const [addressCity, setAddressCity] = React.useState('');
  const [addressRegion, setAddressRegion] = React.useState('');
  const [street, setStreet] = React.useState('');
  const [lat, setLat] = React.useState<number | null>(null);
  const [lng, setLng] = React.useState<number | null>(null);
  const [youtubeUrl, setYoutubeUrl] = React.useState('');
  const [around, setAround] = React.useState<Record<string, boolean>>({});
  const [media, setMedia] = React.useState<Record<string, boolean>>({});
  const [details, setDetails] = React.useState<Record<string, string | number>>({});
  const [photos, setPhotos] = React.useState<GalleryItem[]>([]);
  const [floorPlans, setFloorPlans] = React.useState<GalleryItem[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadedCount, setUploadedCount] = React.useState(0);

  const toAbs = React.useCallback((u?: string | null) => {
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    let url = u;
    if (url.startsWith('/listing_images')) url = `/storage${url}`;
    if (url.startsWith('listing_images')) url = `/storage/${url}`;
    if (url.startsWith('/storage')) return `${apiOrigin}${url}`;
    if (url.startsWith('storage')) return `${apiOrigin}/${url}`;
    if (url.startsWith('/')) return `${apiOrigin}${url}`;
    return `${apiOrigin}/${url}`;
  }, [apiOrigin]);

  React.useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/api/v1/listings/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        const l: LoadedListing = Array.isArray(raw?.data) ? raw.data[0] : (raw?.data ?? raw);
        if (!alive) return;

        setCategory(l.category || 'Mieszkania');
        setOfferType(l.offer_type || 'sprzedaz');
        setTitle(l.title || '');
        setDescription(l.description || '');
        setPrice(withThousandsDots(String(Math.round((l.price ?? 0) / 100))));
        setArea(withThousandsDots(String(l.area ?? '')));
        setAddressCity(l.address_city || '');
        setAddressRegion(l.address_region || '');
        setStreet(l.street || '');
        setLat(l.lat ?? null);
        setLng(l.lng ?? null);
        setYoutubeUrl(l.youtube_url || '');
        setAround(l.surroundings || {});
        setMedia(l.media || { ...MEDIA_DEFAULT });
        setDetails(l.details || {});

        const pickUrl = (x: any): string | null => x?.url ?? x?.full_url ?? x?.image_url ?? x?.original_url ?? x?.src ?? x?.path ?? x?.file_path ?? null;
        const fixedImgs: ApiImage[] = (Array.isArray(l.images) ? l.images : [])
          .map((x: any, i: number) => ({
            id: Number(x?.id ?? i),
            url: toAbs(pickUrl(x)),
            order: Number(x?.order ?? i),
            type: x?.type === 'floorplan' ? 'floorplan' : 'photo',
          }))
          .filter((x: ApiImage) => !!x.url)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        const existingPhotos = fixedImgs.filter(img => img.type === 'photo');
        const existingFloorplans = fixedImgs.filter(img => img.type === 'floorplan');

        setPhotos(existingPhotos);
        setFloorPlans(existingFloorplans);
      } catch {
        setMessage('Nie udało się załadować ogłoszenia.');
      } finally {
        if (alive) setLoading(false);
      }
    }
    if (id) load();
    return () => { alive = false; };
  }, [id, token, apiBase, toAbs]);

  const sanitizedAround = React.useMemo(
    () => Object.fromEntries(Object.keys(AROUND_DEFAULT).map(k => [k, !!(around as any)[k]])),
    [around]
  );
  const sanitizedMedia = React.useMemo(
    () => Object.fromEntries(Object.keys(MEDIA_DEFAULT).map(k => [k, !!(media as any)[k]])),
    [media]
  );

  const newPhotos = React.useMemo(() => photos.filter(p => p instanceof File) as File[], [photos]);
  const newFloorPlans = React.useMemo(() => floorPlans.filter(p => p instanceof File) as File[], [floorPlans]);
  const totalNewToUpload = newPhotos.length + newFloorPlans.length;

  const imagesOrder = React.useMemo(
    () => {
      const all = [...photos, ...floorPlans];
      return all.filter((p): p is ApiImage => 'id' in p).map(p => p.id);
    },
    [photos, floorPlans]
  );

  // ===== WALIDACJE =====
  type Errors = {
    title?: string | null;
    price?: string | null;
    area?: string | null;
    location?: string | null;
    rok_budowy?: string | null;
  };

  const errors: Errors = React.useMemo(() => {
    const e: Errors = {};
    if (!title.trim()) e.title = 'Dodaj tytuł oferty.';
    const p = unformatToNumber(price);
    if (p <= 0) e.price = 'Cena musi być większa od zera.';
    const a = unformatToNumber(area);
    if (a <= 0) e.area = 'Powierzchnia musi być większa od zera.';
    if (lat === null || lng === null || !addressCity.trim() || !addressRegion.trim()) {
      e.location = 'Uzupełnij miasto, województwo i wskaż pinezkę na mapie.';
    }
    // Rok budowy – jeśli pole istnieje w details
    const rbRaw = details.rok_budowy;
    if (rbRaw !== undefined && String(rbRaw).trim() !== '') {
      const rb = Number(onlyDigits(String(rbRaw)));
      if (!rb || rb < 1500 || rb > THIS_YEAR) {
        e.rok_budowy = `Rok budowy musi być w zakresie 1500–${THIS_YEAR}.`;
      }
    }
    return e;
  }, [title, price, area, lat, lng, addressCity, addressRegion, details]);

  const canGoPreview =
    !errors.title &&
    !errors.price &&
    !errors.area &&
    !errors.location &&
    !!sanitizeDescription(description).trim() &&
    photos.length > 0;

  const canSubmit = canGoPreview && !uploading;

  const goPreview = () => setStep(2);
  const backToEdit = () => setStep(1);

  const handleDeleteImage = async (imageToDelete: GalleryItem, galleryType: 'photos' | 'floorPlans') => {
    if (imageToDelete instanceof File) {
      if (galleryType === 'photos') setPhotos(current => current.filter(p => p !== imageToDelete));
      else setFloorPlans(current => current.filter(p => p !== imageToDelete));
      return;
    }
    const imageId = imageToDelete.id;
    try {
      const res = await fetch(`${apiBase}/api/v1/listings/${id}/images/${imageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setMessage(`Nie udało się usunąć zdjęcia (ID: ${imageId}).`);
        return;
      }
      setMessage('Zdjęcie usunięte.');
      if (galleryType === 'photos') setPhotos(current => current.filter(p => (p as ApiImage).id !== imageId));
      else setFloorPlans(current => current.filter(p => (p as ApiImage).id !== imageId));
    } catch {
      setMessage('Błąd sieciowy podczas usuwania zdjęcia.');
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setMessage('Zapisywanie zmian…');

    try {
      const payload = {
        title: title.trim(),
        description: sanitizeDescription(description),
        price: Math.round(unformatToNumber(price) * 100),
        area: unformatToNumber(area),
        address_city: addressCity,
        address_region: addressRegion,
        street: street || null,
        lat, lng,
        category,
        offer_type: offerType,
        youtube_url: youtubeUrl || null,
        surroundings: sanitizedAround,
        media: sanitizedMedia,
        details,
        images_order: imagesOrder,
      };

      const res = await fetch(`${apiBase}/api/v1/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errTxt = `HTTP ${res.status}`;
        try {
          const data = await res.json();
          if (data?.errors) errTxt += ` – ${JSON.stringify(data.errors)}`;
          else if (data?.message) errTxt += ` – ${data.message}`;
          else errTxt += ` – ${JSON.stringify(data)}`;
        } catch {
          const text = await res.text();
          if (text) errTxt += ` – ${text.slice(0, 500)}`;
        }
        throw new Error(errTxt);
      }

      // upload NOWYCH zdjęć
      if (newPhotos.length > 0 || newFloorPlans.length > 0) {
        setUploading(true);
        setUploadedCount(0);
        for (let i = 0; i < newPhotos.length; i++) {
          const form = new FormData();
          form.append('image', newPhotos[i]);
          await fetch(`${apiBase}/api/v1/listings/${id}/images?type=photo`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          }).then(up => up.ok && setUploadedCount(n => n + 1));
        }
        for (let i = 0; i < newFloorPlans.length; i++) {
          const form = new FormData();
          form.append('image', newFloorPlans[i]);
          await fetch(`${apiBase}/api/v1/listings/${id}/images?type=floorplan`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          }).then(up => up.ok && setUploadedCount(n => n + 1));
        }
        setUploading(false);
      }

      setMessage('Zapisano. Przenoszę do szczegółów…');
      router.replace(`/ogloszenia/${id}`);
    } catch (e: any) {
      setMessage(e?.message || 'Nie udało się zapisać zmian.');
      setUploading(false);
    }
  };

if (isLoading || loading || abilitiesLoading || !user) {
  return <p className="p-8 text-center">Ładowanie…</p>;
}

  return (
    <main className="py-6 md:py-8">
      <header className="container-page mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Edytuj ogłoszenie</h1>
        <p className="text-gray-600 mt-1">Zaktualizuj dane i zapisz zmiany.</p>
        {!!message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
      </header>

      {step === 1 && (
        <section className="container-page grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEWA KOLUMNA */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-modern p-5 md:p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Kategoria</h2>
                <span className="text-xs rounded-full bg-gray-100 px-2 py-1 text-gray-600">Nie można zmienić</span>
              </div>
              <div className="relative">
                <div className="pointer-events-none opacity-100"><CategorySelect value={category} onChange={() => {}} /></div>
                <div className="absolute inset-0 pointer-events-auto rounded-xl" title="Kategoria jest zablokowana w edycji" />
              </div>
            </div>

            <div className="card-modern p-5 md:p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Typ oferty</h2>
                <span className="text-xs rounded-full bg-gray-100 px-2 py-1 text-gray-600">Nie można zmienić</span>
              </div>
              <div className="relative">
                <div className="pointer-events-none opacity-100"><OfferTypeSelect value={offerType} onChange={() => {}} /></div>
                <div className="absolute inset-0 pointer-events-auto rounded-xl" title="Typ oferty jest zablokowany w edycji" />
              </div>
            </div>

            <div className="card-modern p-5 md:p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Opis oferty</h2>
                <p className="text-sm text-gray-600 mt-0.5">Dodaj konkretne informacje – tytuł, opis, cena i metraż.</p>
              </div>
              <div>
                <label className="form-label">Tytuł</label>
                <input
                  className={`input-modern ${errors.title ? 'ring-2 ring-red-500' : ''}`}
                  placeholder="Np. 2 pokoje z balkonem, Stare Miasto"
                  value={title}
                  aria-invalid={!!errors.title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {!!errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="form-label">Opis</label>
                <RichTextSmall value={description} onChange={setDescription} />
              </div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* CENA */}
  <div>
    <label className="form-label">Cena [zł]</label>
    <div className="input-group">
      <input
        className="input-modern"
        inputMode="numeric"
        placeholder="np. 785.000"
        value={price}
        onChange={(e) => setPrice(formatPriceInput(e.target.value))}
      />
      <span className="input-suffix">zł</span>
    </div>
  </div>

  {/* POWIERZCHNIA */}
  <div>
    <label className="form-label">Powierzchnia [m²]</label>
    <div className="input-group">
      <input
        className="input-modern"
        inputMode="numeric"
        placeholder="np. 56"
        value={area}
        onChange={(e) => setArea(formatAreaInput(e.target.value))}
      />
      <span className="input-suffix">m²</span>
    </div>
  </div>
</div>
</div>

            <div className="card-modern p-5 md:p-6">
              <div className="mb-3">
                <h2 className="text-lg font-semibold">Lokalizacja</h2>
                <p className="text-sm text-gray-600 mt-0.5">Wpisz miasto/województwo i ustaw pinezkę na mapie.</p>
              </div>
              <LocationPicker
                onCityChange={setAddressCity}
                onRegionChange={setAddressRegion}
                onCoordsChange={(la, ln) => { setLat(la); setLng(ln); }}
                initialCity={addressCity}
                initialRegion={addressRegion}
                initialCoords={lat != null && lng != null ? [lat, lng] : null}
                street={street}
                onStreetChange={setStreet}
                showStreet
              />
            </div>

            <div className="card-modern p-5 md:p-6 space-y-4">
              <h2 className="text-[17px] md:text-lg font-semibold tracking-tight">Informacje dodatkowe</h2>
              {/* Inputs FIRST */}
              <CategorySpecificFields
                category={category}
                details={details}
                setDetails={setDetails}
                rokBudowyError={errors.rok_budowy}
              />
            </div>

            <section className="space-y-4">
              <NearbyPicker key={`nearby-${id}`} values={around} onToggle={(k, v) => setAround((s) => ({ ...s, [k]: v }))} />
              <MediaPicker key={`media-${id}`} values={media} onToggle={(k, v) => setMedia((s) => ({ ...s, [k]: v }))} />
            </section>

            <div className="card-modern p-5 md:p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Galeria zdjęć</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 18L16 6M8 6l8 12"/></svg>
                <span>Przeciągnij, aby ustawić kolejność. Pierwsze zdjęcie to miniatura.</span>
              </div>
              <ImageUploader
                images={photos}
                onChange={(arr) => setPhotos(() => arr.slice())}
                onDelete={(item) => handleDeleteImage(item as GalleryItem, 'photos')}
              />
              {uploading && totalNewToUpload > 0 && <p className="mt-3 text-sm text-gray-700">Przesyłanie zdjęć… {uploadedCount}/{totalNewToUpload}</p>}
            </div>

            <div className="card-modern p-5 md:p-6">
              <h2 className="text-lg font-semibold mb-2">Plany pięter (opcjonalnie)</h2>
              <ImageUploader
                images={floorPlans}
                onChange={(arr) => setFloorPlans(() => arr.slice())}
                onDelete={(item) => handleDeleteImage(item as GalleryItem, 'floorPlans')}
              />
            </div>
          </div>

          {/* PRAWA KOLUMNA – sticky panel */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">

              <div className="card-modern p-5">
                <div className="flex flex-col gap-3">
                  <button onClick={goPreview} disabled={!canGoPreview} className="btn-ghost !py-2 !px-5">
                    Podgląd zmian
                  </button>
{abilities.update && (
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSubmit}
        className="btn-primary !py-2 !px-5"
        title={!canSubmit ? 'Uzupełnij wymagane pola' : ''}
      >
        Zapisz zmiany
      </button>
    )}
                </div>
              </div>
            </div>
          </aside>
        </section>
      )}

      {step === 2 && (
        <section className="container-page space-y-6">
          <div className="card-modern p-5 md:p-6 space-y-3">
            <h2 className="text-lg font-semibold">Podgląd</h2>
            <div className="text-sm text-gray-600">Tak będzie wyglądała oferta (zapisz, aby opublikować zmiany).</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">{title}</h3>
                <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeDescription(description) }} />
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Cena:</strong> {price ? `${price} zł` : '—'}</div>
                  <div><strong>Powierzchnia:</strong> {area ? `${area} m²` : '—'}</div>
                  <div><strong>Lokalizacja:</strong> {[street, addressCity, addressRegion].filter(Boolean).join(', ') || '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[...photos, ...floorPlans].slice(0, 4).map((item, idx) => {
                  const url = item instanceof File ? URL.createObjectURL(item) : item.url;
                  const key = item instanceof File ? `new-${idx}-${(item as File).name}` : `old-${(item as ApiImage).id}`;
                  return (
                    <div key={key} className="aspect-[4/3] overflow-hidden rounded-lg border">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <button onClick={backToEdit} className="btn-ghost">Wróć do edycji</button>
            <button type="button" onClick={handleSave} disabled={!canSubmit} className="btn-primary px-6">
              Zapisz zmiany
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

/* ===== Parametry kategorii – inputs najpierw, potem selecty, z walidacją roku ===== */
function CategorySpecificFields({
  category,
  details,
  setDetails,
  rokBudowyError,
}: {
  category: string;
  details: Record<string, string | number>;
  setDetails: React.Dispatch<React.SetStateAction<Record<string, string | number>>>;
  rokBudowyError?: string | null;
}) {
  const set = (k: string) => (v: string) =>
    setDetails((s) => ({ ...s, [k]: v }));

  const YearInput = (
    <div>
      <label className="form-label">Rok budowy</label>
      <input
        className={`input-modern ${rokBudowyError ? 'ring-2 ring-red-500' : ''}`}
        inputMode="numeric"
        placeholder={`1500–${THIS_YEAR}`}
        value={String(details.rok_budowy ?? '')}
        onChange={(e) => set('rok_budowy')(onlyDigits(e.target.value))}
        aria-invalid={!!rokBudowyError}
      />
      {!!rokBudowyError && <p className="text-xs text-red-600 mt-1">{rokBudowyError}</p>}
    </div>
  );

  if (['Mieszkania', 'Domy'].includes(category)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* INPUTS FIRST */}
        {YearInput}
        <div>
          <label className="form-label">Liczba pokoi</label>
          <input className="input-modern" inputMode="numeric" value={String(details.liczba_pokoi ?? '')} onChange={(e) => set('liczba_pokoi')(onlyDigits(e.target.value))} />
        </div>
        <div>
          <label className="form-label">Piętro</label>
          <input className="input-modern" inputMode="numeric" value={String(details.pietro ?? '')} onChange={(e) => set('pietro')(onlyDigits(e.target.value))} />
        </div>

        {/* SELECTS */}
        <SelectField label="Rynek" value={String(details.rynek ?? '')} onChange={set('rynek')} options={[['pierwotny', 'pierwotny'], ['wtorny', 'wtórny']]} />
        <SelectField label="Typ budynku" value={String(details.typ_budynku ?? '')} onChange={set('typ_budynku')} options={[['blok', 'blok'], ['kamienica', 'kamienica'], ['apartamentowiec', 'apartamentowiec'], ['dom wolnostojący', 'dom wolnostojący']]} />
        <SelectField label="Ogrzewanie" value={String(details.ogrzewanie ?? '')} onChange={set('ogrzewanie')} options={[['miejskie', 'miejskie'], ['gazowe', 'gazowe'], ['elektryczne', 'elektryczne'], ['inne', 'inne']]} />
        <SelectField label="Stan techniczny" value={String(details.stan ?? '')} onChange={set('stan')} options={[['do zamieszkania', 'do zamieszkania'], ['do odświeżenia', 'do odświeżenia'], ['do remontu', 'do remontu']]} />
        <SelectField label="Balkon / taras" value={String(details.balkon ?? '')} onChange={set('balkon')} options={[['', '-'], ['balkon', 'balkon'], ['taras', 'taras'], ['loggia', 'loggia'], ['brak', 'brak']]} />
        <SelectField label="Winda" value={String(details.winda ?? '')} onChange={set('winda')} options={[['', '-'], ['tak', 'tak'], ['nie', 'nie']]} />
        <SelectField label="Miejsce parkingowe" value={String(details.miejsce_parkingowe ?? '')} onChange={set('miejsce_parkingowe')} options={[['', '-'], ['brak', 'brak'], ['naziemne', 'naziemne'], ['garaż', 'garaż']]} />
        <SelectField label="Materiał" value={String(details.material ?? '')} onChange={set('material')} options={[['', '-'], ['cegła', 'cegła'], ['wielka płyta', 'wielka płyta'], ['silikat', 'silikat'], ['inne', 'inne']]} />
      </div>
    );
  }

  if (category === 'Dzialki' || category === 'Działki') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* INPUTS FIRST */}
        <div>
          <label className="form-label">Powierzchnia działki [m²]</label>
          <input className="input-modern" inputMode="numeric" value={String(details.pow_dzialki ?? '')} onChange={(e) => set('pow_dzialki')(onlyDigits(e.target.value))} />
        </div>
        {/* SELECTS */}
        <SelectField label="Typ działki" value={String(details.typ_dzialki ?? '')} onChange={set('typ_dzialki')} options={[['budowlana', 'budowlana'], ['rolna', 'rolna'], ['rekreacyjna', 'rekreacyjna'], ['inwestycyjna', 'inwestycyjna']]} />
        <SelectField label="Kształt działki" value={String(details.ksztalt_dzialki ?? '')} onChange={set('ksztalt_dzialki')} options={[['prostokąt', 'prostokąt'], ['kwadrat', 'kwadrat'], ['nieregularny', 'nieregularny']]} />
        <SelectField label="Teren" value={String(details.teren_dzialki ?? '')} onChange={set('teren_dzialki')} options={[['płaski', 'płaski'], ['pochyły', 'pochyły'], ['zróżnicowany', 'zróżnicowany']]} />
        <SelectField label="Droga dojazdowa" value={String(details.droga_dojazdowa ?? '')} onChange={set('droga_dojazdowa')} options={[['asfaltowa', 'asfaltowa'], ['utwardzona', 'utwardzona'], ['polna', 'polna']]} />
      </div>
    );
  }

  if (category === 'Garaze' || category === 'Garaże') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* INPUTS FIRST */}
        {YearInput}
        {/* SELECTS */}
        <SelectField label="Typ garażu" value={String(details.typ_garazu ?? '')} onChange={set('typ_garazu')} options={[['murowany', 'murowany'], ['blaszak', 'blaszak'], ['podziemny', 'podziemny']]} />
        <SelectField label="Stan" value={String(details.stan ?? '')} onChange={set('stan')} options={[['dobry', 'dobry'], ['do odświeżenia', 'do odświeżenia'], ['do remontu', 'do remontu']]} />
      </div>
    );
  }

  if (['Lokale', 'Hale', 'Hotele', 'Hotele i pensjonaty'].includes(category)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* INPUTS FIRST */}
        {YearInput}
        <div>
          <label className="form-label">Liczba miejsc</label>
          <input className="input-modern" inputMode="numeric" value={String(details.liczba_miejsc ?? '')} onChange={(e) => set('liczba_miejsc')(onlyDigits(e.target.value))} />
        </div>

        {/* SELECTS */}
        <SelectField label="Kuchnia" value={String(details.kuchnia ?? '')} onChange={set('kuchnia')} options={[['brak', 'brak'], ['zaplecze', 'zaplecze'], ['pełna', 'pełna']]} />
        <SelectField label="Standard" value={String(details.standard ?? '')} onChange={set('standard')} options={[['podstawowy', 'podwyższony'], ['podwyższony', 'premium']]} />
        <SelectField label="Sezonowość" value={String(details.sezonowosc ?? '')} onChange={set('sezonowosc')} options={[['całoroczny', 'całoroczny'], ['sezonowy', 'sezonowy']]} />
      </div>
    );
  }

  return <p className="text-sm text-gray-600">Dla wybranej kategorii brak dodatkowych pól.</p>;
}

/* ===== drobne wspólne pola ===== */
function InputField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (<div><label className="form-label">{label}</label><input className="input-modern" value={value} onChange={(e) => onChange(e.target.value)} type={type} /></div>);
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <select className="input-modern" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— wybierz —</option>
        {options.map(([val, caption]) => <option key={val} value={val}>{caption}</option>)}
      </select>
    </div>
  );
}

function RichTextSmall({ value, onChange }: { value: string; onChange: (html: string) => void; }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const exec = (cmd: 'bold' | 'italic' | 'underline') => { if(typeof window !== 'undefined') document.execCommand(cmd, false); if (ref.current) onChange(ref.current.innerHTML); };
  const handleInput = () => { if (ref.current) onChange(ref.current.innerHTML); };
  React.useEffect(() => { if (!ref.current) return; if (ref.current.innerHTML !== value) ref.current.innerHTML = value; }, [value]);
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <button type="button" className="rounded border px-2 py-1 text-sm hover:bg-gray-50" onClick={() => exec('bold')}><b>B</b></button>
        <button type="button" className="rounded border px-2 py-1 text-sm hover:bg-gray-50" onClick={() => exec('italic')}><i>I</i></button>
        <button type="button" className="rounded border px-2 py-1 text-sm hover:bg-gray-50" onClick={() => exec('underline')}><u>U</u></button>
        <span className="ml-3 text-xs text-gray-500">Enter = nowa linia</span>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="min-h-[160px] w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:ring-2 focus:ring-blue-200"
        placeholder="Opisz atuty i szczegóły nieruchomości…"
        suppressContentEditableWarning
      />
    </div>
  );
}
