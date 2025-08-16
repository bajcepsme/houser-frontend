'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { NearbyPicker, MediaPicker } from './components/Amenities';
import { useListingAbilities } from '@/hooks/useListingAbilities';
import ImageUploader from '@/components/ImageUploader';
import ListingPreview from './components/ListingPreview';
import LocationPicker from './components/LocationPicker';

/** Ikony (tak, jak w Twoim repo: src/app/dodaj-ogloszenie/ikonki) */
import domyIco from './ikonki/domy2.webp';
import dzialkiIco from './ikonki/dzialki2.webp';
import dzierzawaIco from './ikonki/dzierzawa2.webp';
import garazeIco from './ikonki/garaze2.webp';
import haleIco from './ikonki/hale2.webp';
import hoteleIco from './ikonki/hotele2.webp';
import lokaleIco from './ikonki/lokale2.webp';
import mieszkaniaIco from './ikonki/mieszkania2.png';
import palaceIco from './ikonki/palace2.webp';

import sprzedazIco from './ikonki/sprzedaz2.webp';
import wynajemIco from './ikonki/wynajem2.webp';
import dzierzawaTypeIco from './ikonki/dzierzawa2.webp';

type FieldMeta =
  | { key: string; label: string; kind: 'text' | 'number' }
  | { key: string; label: string; kind: 'select'; options: [string, string][] };

type OfferType = 'sprzedaz' | 'wynajem' | 'dzierzawa';

type CreatePayload = {
  title: string;
  description: string; // dozwolony html
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
};

/* ———————————————————— IKONY + SŁOWNIK PÓL ———————————————————— */

const CATEGORY_ICONS: { slug: string; label: string; icon: any }[] = [
  { slug: 'Mieszkania', label: 'Mieszkania', icon: mieszkaniaIco },
  { slug: 'Domy', label: 'Domy', icon: domyIco },
  { slug: 'Działki', label: 'Działki', icon: dzialkiIco },
  { slug: 'Lokale usługowe', label: 'Lokale usługowe', icon: lokaleIco },
  { slug: 'Hale i magazyny', label: 'Hale i magazyny', icon: haleIco },
  { slug: 'Garaże', label: 'Garaże', icon: garazeIco },
  { slug: 'Hotele i pensjonaty', label: 'Hotele i pensjonaty', icon: hoteleIco },
  { slug: 'Pałace i zamki', label: 'Pałace i zamki', icon: palaceIco },
];

const OFFER_ICONS: { type: OfferType; label: string; icon: any }[] = [
  { type: 'sprzedaz', label: 'Sprzedaż', icon: sprzedazIco },
  { type: 'wynajem', label: 'Wynajem', icon: wynajemIco },
  { type: 'dzierzawa', label: 'Dzierżawa', icon: dzierzawaTypeIco },
];

const FIELDS_BY_CATEGORY: Record<string, FieldMeta[]> = {
  Mieszkania: [
    { key: 'rynek', label: 'Rynek', kind: 'select', options: [['pierwotny','pierwotny'],['wtorny','wtórny']] },
    { key: 'rok_budowy', label: 'Rok budowy', kind: 'number' },
    { key: 'liczba_pokoi', label: 'Liczba pokoi', kind: 'number' },
    { key: 'pietro', label: 'Piętro', kind: 'number' },
    { key: 'typ_budynku', label: 'Typ budynku', kind: 'select', options: [['blok','blok'],['kamienica','kamienica'],['apartamentowiec','apartamentowiec']] },
    { key: 'ogrzewanie', label: 'Ogrzewanie', kind: 'select', options: [['miejskie','miejskie'],['gazowe','gazowe'],['elektryczne','elektryczne'],['inne','inne']] },
    { key: 'stan', label: 'Stan techniczny', kind: 'select', options: [['do zamieszkania','do zamieszkania'],['do odświeżenia','do odświeżenia'],['do remontu','do remontu']] },
    { key: 'balkon', label: 'Balkon / taras', kind: 'select', options: [['','-'],['balkon','balkon'],['taras','taras'],['loggia','loggia'],['brak','brak']] },
    { key: 'winda', label: 'Winda', kind: 'select', options: [['','-'],['tak','tak'],['nie','nie']] },
    { key: 'miejsce_parkingowe', label: 'Miejsce parkingowe', kind: 'select', options: [['','-'],['brak','brak'],['naziemne','naziemne'],['garaż','garaż']] },
    { key: 'material', label: 'Materiał', kind: 'select', options: [['','-'],['cegła','cegła'],['wielka płyta','wielka płyta'],['silikat','silikat'],['inne','inne']] },
  ],
  Domy: [
    { key: 'rynek', label: 'Rynek', kind: 'select', options: [['pierwotny','pierwotny'],['wtorny','wtórny']] },
    { key: 'rok_budowy', label: 'Rok budowy', kind: 'number' },
    { key: 'liczba_pokoi', label: 'Liczba pokoi', kind: 'number' },
    { key: 'ogrzewanie', label: 'Ogrzewanie', kind: 'select', options: [['gazowe','gazowe'],['elektryczne','elektryczne'],['pompa ciepła','pompa ciepła'],['inne','inne']] },
    { key: 'stan', label: 'Stan techniczny', kind: 'select', options: [['do zamieszkania','do zamieszkania'],['do odświeżenia','do odświeżenia'],['do remontu','do remontu']] },
    { key: 'garaz', label: 'Garaż', kind: 'select', options: [['brak','brak'],['w bryle','w bryle'],['wolnostojący','wolnostojący']] },
    { key: 'material', label: 'Materiał', kind: 'select', options: [['','-'],['ceramika','ceramika'],['silikat','silikat'],['ytong','ytong'],['drewno','drewno'],['inne','inne']] },
  ],
  'Działki': [
    { key: 'przeznaczenie', label: 'Przeznaczenie', kind: 'select', options: [['budowlana','budowlana'],['rolna','rolna'],['rekreacyjna','rekreacyjna'],['inwestycyjna','inwestycyjna']] },
    { key: 'ksztalt_dzialki', label: 'Kształt działki', kind: 'select', options: [['regularny','regularny'],['nieregularny','nieregularny']] },
    { key: 'dojazd', label: 'Dojazd', kind: 'select', options: [['asfalt','asfalt'],['kostka','kostka'],['utwardzony','utwardzony'],['polny','polny']] },
    { key: 'ogrodzenie', label: 'Ogrodzenie', kind: 'select', options: [['brak','brak'],['siatka','siatka'],['pełne','pełne']] },
  ],
  'Lokale usługowe': [
    { key: 'pietro', label: 'Piętro', kind: 'number' },
    { key: 'przeznaczenie', label: 'Przeznaczenie', kind: 'select', options: [['biurowe','biurowe'],['handlowe','handlowe'],['usługowe','usługowe'],['medyczne','medyczne']] },
    { key: 'witryna', label: 'Witryna', kind: 'select', options: [['tak','tak'],['nie','nie']] },
    { key: 'klimatyzacja', label: 'Klimatyzacja', kind: 'select', options: [['tak','tak'],['nie','nie']] },
  ],
  'Hale i magazyny': [
    { key: 'wysokosc', label: 'Wysokość (m)', kind: 'number' },
    { key: 'brama', label: 'Brama wjazdowa', kind: 'select', options: [['rolowana','rolowana'],['segmentowa','segmentowa'],['dwuskrzydłowa','dwuskrzydłowa']] },
    { key: 'plac_manewrowy', label: 'Plac manewrowy', kind: 'select', options: [['tak','tak'],['nie','nie']] },
    { key: 'ogrzewanie', label: 'Ogrzewanie', kind: 'select', options: [['brak','brak'],['gazowe','gazowe'],['nadmuchowe','nadmuchowe'],['inne','inne']] },
  ],
  'Garaże': [
    { key: 'typ_garazu', label: 'Typ garażu', kind: 'select', options: [['wolnostojący','wolnostojący'],['w bryle','w bryle'],['podziemny','podziemny']] },
    { key: 'brama_na_pilota', label: 'Brama na pilota', kind: 'select', options: [['tak','tak'],['nie','nie']] },
  ],
  'Hotele i pensjonaty': [
    { key: 'rok_budowy', label: 'Rok budowy', kind: 'number' },
    { key: 'standard', label: 'Standard', kind: 'select', options: [['***','***'],['****','****'],['*****','*****'],['inne','inne']] },
    { key: 'pokoje_gosci', label: 'Liczba pokoi gościnnych', kind: 'number' },
  ],
  'Pałace i zamki': [
    { key: 'rok_budowy', label: 'Rok budowy', kind: 'number' },
    { key: 'stan', label: 'Stan techniczny', kind: 'select', options: [['do remontu','do remontu'],['do odświeżenia','do odświeżenia'],['dobry','dobry']] },
    { key: 'powierzchnia_dzialki', label: 'Pow. działki (m²)', kind: 'number' },
  ],
};

/* ———————————————————— POMOCNIKI FORMATUJĄCE ———————————————————— */

// tylko cyfry
const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');
// 1234567 -> "1.234.567"
const formatThousandsDots = (digits: string) => {
  if (!digits) return '';
  const rev = digits.split('').reverse();
  const out: string[] = [];
  rev.forEach((ch, idx) => {
    if (idx > 0 && idx % 3 === 0) out.push('.');
    out.push(ch);
  });
  return out.reverse().join('');
};

function useFormattedNumberField(suffix: string) {
  const [raw, setRaw] = React.useState(''); // tylko cyfry
  const display = raw ? `${formatThousandsDots(raw)}${suffix}` : '';
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRaw(onlyDigits(e.target.value));
  };
  const setFromRaw = (val: string | number) => setRaw(onlyDigits(String(val ?? '')));
  return { raw, setRaw: setFromRaw, display, onChange };
}

/* ———————————————————— STRONA ———————————————————— */

export default function AddListingPage() {
  const { user, isLoading } = useAuthGuard();
  const { token } = useAuth();
  const router = useRouter();

  const [step, setStep] = React.useState<1 | 2>(1);

  const [category, setCategory] = React.useState<string>('');
  const [offerType, setOfferType] = React.useState<OfferType | ''>('');

  const [title, setTitle] = React.useState('');
  const [descriptionHtml, setDescriptionHtml] = React.useState('');

  // sformatowane pola:
  const priceField = useFormattedNumberField(' zł');
  const areaField = useFormattedNumberField(' m²');

  const [addressCity, setAddressCity] = React.useState('');
  const [addressRegion, setAddressRegion] = React.useState('');
  const [street, setStreet] = React.useState('');
  const [lat, setLat] = React.useState<number | null>(null);
  const [lng, setLng] = React.useState<number | null>(null);

  const [youtubeUrl, setYoutubeUrl] = React.useState('');

  const [around, setAround] = React.useState<Record<string, boolean>>({
    centrum: false, szkola: false, sklep: false, park: false, przystanek: false,
    apteka: false, basen: false, przychodnia: false, poczta: false,
  });
  const [media, setMedia] = React.useState<Record<string, boolean>>({
    gaz: false, prad: false, woda: false, kanalizacja: false, sila: false, internet: false,
  });

  const [details, setDetails] = React.useState<Record<string, string | number>>({});
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [floorPlans, setFloorPlans] = React.useState<File[]>([]);

  const [errors, setErrors] = React.useState<any>({});
  const [message, setMessage] = React.useState(''); // status tekst
  const [uploading, setUploading] = React.useState(false);
  const [uploadedCount, setUploadedCount] = React.useState(0);

  const isBusy = Boolean(message) || uploading;

  const canShowOfferTypes = !!category;
  const canShowRest = !!category && !!offerType;

  const canGoPreview =
    !!title.trim() &&
    !!sanitizeDescription(descriptionHtml).trim() &&
    !!priceField.raw &&
    !!areaField.raw &&
    !!addressCity.trim() &&
    !!addressRegion.trim() &&
    lat !== null &&
    lng !== null &&
    photos.length > 0;

  const allowedDescriptionHtml = React.useMemo(() => sanitizeDescription(descriptionHtml), [descriptionHtml]);

  // === KROK 2: utworzenie szkicu i skok do cennika ===
  async function handleCreateDraftThenPricing() {
    if (!token || !offerType || !category) return;
    setErrors({});
    setMessage('Tworzenie szkicu ogłoszenia…');

    const payload: CreatePayload = {
      title: title.trim(),
      description: allowedDescriptionHtml,
      price: Math.round(parseFloat((priceField.raw || '0')) * 100), // PLN -> grosze
      area: parseFloat(areaField.raw || '0'),
      address_city: addressCity,
      address_region: addressRegion,
      street: street || null,
      lat, lng,
      category,
      offer_type: offerType as OfferType,
      youtube_url: youtubeUrl || null,
      surroundings: around,
      media,
      details,
    };

    try {
      const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
      const res = await fetch(`${base}/api/v1/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors(data?.errors || {});
        setMessage('Błąd walidacji.');
        return;
      }

      const created = await res.json();
      const newId: number | undefined = created?.id ?? created?.data?.id;
      if (!newId) {
        setMessage('Utworzono, ale nie udało się odczytać ID nowego ogłoszenia.');
        return;
      }

      // upload zdjęć
      if (photos.length > 0) {
        setUploading(true);
        setMessage('Przesyłanie zdjęć…');
        setUploadedCount(0);
        for (let i = 0; i < photos.length; i++) {
          const form = new FormData();
          form.append('image', photos[i]);
          await fetch(`${base}/api/v1/listings/${newId}/images`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          }).then((up) => up.ok && setUploadedCount((n) => n + 1));
        }
        setUploading(false);
      }

      // plany pięter (opcjonalnie)
      if (floorPlans.length > 0) {
        setUploading(true);
        setMessage('Przesyłanie planów pięter…');
        for (let i = 0; i < floorPlans.length; i++) {
          const form = new FormData();
          form.append('image', floorPlans[i]);
          await fetch(`${base}/api/v1/listings/${newId}/images?type=floorplan`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          }).then((up) => up.ok && setUploadedCount((n) => n + 1));
        }
        setUploading(false);
      }

      setMessage('Gotowe! Przekierowuję do wyboru pakietu…');
      router.replace(`/cennik?listingId=${newId}&draft=1`);
    } catch (e: any) {
      setMessage(e?.message || 'Błąd połączenia.');
    }
  }

  if (isLoading || !user) return <p className="p-8 text-center">Ładowanie…</p>;

  const dynamicFields = FIELDS_BY_CATEGORY[category || ''] || [];

  return (
    <main className="container-page py-6 md:py-8">
      {/* Pasek statusu */}
      <TopStatus visible={isBusy} text={uploading ? `Przesyłanie… ${uploadedCount}` : message} />

      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Dodaj ogłoszenie</h1>
        <p className="text-gray-600 mt-1">
          Najpierw uzupełnij dane, później zobacz podgląd i wybierz pakiet.
        </p>
      </header>

      {/* KROK 1 – FORMULARZ */}
      {step === 1 && (
        <>
          {/* KATEGORIA */}
          <section className="card-modern p-5 md:p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2 text-center">Wybierz kategorię nieruchomości</h2>
            <p className="text-sm text-gray-600 text-center mb-4">
              To pozwoli wyświetlić tylko adekwatne pola formularza.
            </p>

            <IconCardGrid
              items={CATEGORY_ICONS.map(c => ({
                id: c.slug,
                title: c.label,
                img: c.icon,
                selected: category === c.slug,
              }))}
              onPick={(id) => {
                setCategory(id);
                setOfferType('');
                setDetails({});
              }}
            />
          </section>

          {/* TYP OFERTY */}
          <AnimatedReveal show={!!category}>
            <section className="card-modern p-5 md:p-6 mb-6">
              <h2 className="text-lg font-semibold mb-2 text-center">Wybierz typ oferty</h2>
              <IconCardGrid
                items={OFFER_ICONS.map(o => ({
                  id: o.type,
                  title: o.label,
                  img: o.icon,
                  selected: offerType === o.type,
                }))}
                onPick={(id) => setOfferType(id as OfferType)}
              />
            </section>
          </AnimatedReveal>

          {/* RESZTA FORMULARZA */}
          <AnimatedReveal show={canShowRest}>
            <section className="space-y-6">
              {/* Opis */}
              <div className="card-modern p-5 md:p-6 space-y-4">
                <h2 className="text-lg font-semibold">Opis oferty</h2>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="form-label">Tytuł</label>
                    <small className="text-xs text-gray-500">
                      Wskazówka: bądź zwięzły – np. „2 pokoje z balkonem, Stare Miasto”.
                    </small>
                  </div>
                  <input
                    className="input-modern"
                    placeholder="Np. 2 pokoje z balkonem, Stare Miasto"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="form-label">Opis</label>
                    <small className="text-xs text-gray-500">
                      Możesz użyć pogrubienia, kursywy i podkreślenia. Skup się na atutach i konkretach.
                    </small>
                  </div>
                  <RichTextSmall value={descriptionHtml} onChange={setDescriptionHtml} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Cena (PLN)</label>
                    <input
                      inputMode="numeric"
                      className="input-modern"
                      placeholder="np. 785.000 zł"
                      value={priceField.display}
                      onChange={priceField.onChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">Powierzchnia</label>
                    <input
                      inputMode="numeric"
                      className="input-modern"
                      placeholder="np. 1.200 m²"
                      value={areaField.display}
                      onChange={areaField.onChange}
                    />
                  </div>
                </div>
              </div>

{/* Lokalizacja */}
{canShowRest && (
  <div className="card-modern p-5 md:p-6">
    <h2 className="text-lg font-semibold mb-3">Lokalizacja</h2>
    <LocationPicker
      onCityChange={setAddressCity}
      onRegionChange={setAddressRegion}
      onCoordsChange={(la, ln) => { setLat(la); setLng(ln); }}
      street={street}
      onStreetChange={setStreet}
      showStreet
    />
  </div>
)}


              {/* Informacje dodatkowe – DYNAMICZNIE wg kategorii */}
              {dynamicFields.length > 0 && (
                <div className="card-modern p-5 md:p-6 space-y-4">
                  <h2 className="text-lg font-semibold">Informacje dodatkowe</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dynamicFields.map((f) => {
                      if (f.kind === 'number' || f.kind === 'text') {
                        return (
                          <InputField
                            key={f.key}
                            label={f.label}
                            value={String(details[f.key] ?? '')}
                            type={f.kind === 'number' ? 'number' : 'text'}
                            onChange={(v) => setDetails((s) => ({ ...s, [f.key]: v }))}
                          />
                        );
                      }
                      return (
                        <SelectField
                          key={f.key}
                          label={f.label}
                          value={String(details[f.key] ?? '')}
                          onChange={(v) => setDetails((s) => ({ ...s, [f.key]: v }))}
                          options={f.options}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Otoczenie i media */}
              <section className="space-y-4">
                <NearbyPicker
                  values={around}
                  onToggle={(k, v) => setAround((s) => ({ ...s, [k]: v }))}
                />
                <MediaPicker
                  values={media}
                  onToggle={(k, v) => setMedia((s) => ({ ...s, [k]: v }))}
                />
              </section>

              {/* Wideo */}
              <div className="card-modern p-5 md:p-6 space-y-4">
                <h2 className="text-lg font-semibold">Wideo (opcjonalnie)</h2>
                <input
                  className="input-modern"
                  placeholder="Link YouTube (np. https://www.youtube.com/watch?v=...)"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
              </div>

              {/* Zdjęcia */}
              <div className="card-modern p-5 md:p-6">
                <h2 className="text-lg font-semibold mb-3">Dodaj nowe zdjęcia</h2>
                <ImageUploader files={photos} setFiles={setPhotos} />
                {uploading && (
                  <p className="mt-3 text-sm text-gray-700">Przesyłanie zdjęć… {uploadedCount}/{photos.length}</p>
                )}
              </div>

              {/* Plany pięter */}
              <div className="card-modern p-5 md:p-6">
                <h2 className="text-lg font-semibold mb-3">Plany pięter (opcjonalnie)</h2>
                <ImageUploader files={floorPlans} setFiles={setFloorPlans} />
              </div>

              {/* CTA – przejście do podglądu */}
              <div className="flex items-center justify-end">
                <button
                  className="btn-primary px-6"
                  onClick={() => setStep(2)}
                  disabled={!canGoPreview}
                  title={!canGoPreview ? 'Brakuje wymaganych danych' : ''}
                >
                  Dalej – podgląd
                </button>
              </div>
            </section>
          </AnimatedReveal>
        </>
      )}

      {/* KROK 2 – PODGLĄD + NAWIGACJA DO CENNIKA */}
      {step === 2 && (
        <section className="space-y-6">
          <div className="card-modern p-4 md:p-6">
            <div className="listing-preview-fix max-w-5xl mx-auto">
              <ListingPreview
                title={title}
                description={allowedDescriptionHtml}
                price={priceField.display}
                area={areaField.display}
                category={category}
                offerType={offerType as OfferType}
                addressCity={addressCity}
                addressRegion={addressRegion}
                lat={lat}
                lng={lng}
                // pokazujemy tylko JEDNO zdjęcie w podglądzie
                files={photos.slice(0, 1)}
                youtubeUrl={youtubeUrl}
                street={street}
                extras={{ around, media, details }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="btn-ghost rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              ‹ Wstecz (edycja)
            </button>
            <button
              className="btn-primary px-6"
              onClick={handleCreateDraftThenPricing}
              title="Przejdź do wyboru pakietu"
            >
              Dalej – wybierz pakiet
            </button>
          </div>

          {message && <p className="text-center text-sm text-gray-700">{message}</p>}
        </section>
      )}

      {/* Lokalny CSS dla stabilizacji podglądu (tylko w obrębie tej strony) */}
      <style jsx global>{`
        .listing-preview-fix img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 12px;
        }
        .listing-preview-fix video, .listing-preview-fix iframe {
          max-width: 100% !important;
        }
      `}</style>
    </main>
  );
}

/* ———— LOKALNE KOMPONENTY ———— */

function InputField({
  label, value, onChange, type = 'text',
}: { label: string; value: string; onChange: (v: string)=>void; type?: string }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <input className="input-modern" value={value} onChange={(e)=>onChange(e.target.value)} type={type} />
    </div>
  );
}

function SelectField({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string)=>void; options: [string,string][] }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <select className="input-modern" value={value} onChange={(e)=>onChange(e.target.value)}>
        {options.map(([val, caption]) => <option key={val} value={val}>{caption}</option>)}
      </select>
    </div>
  );
}

function IconCardGrid({
  items,
  onPick,
}: {
  items: { id: string; title: string; img: any; selected?: boolean }[];
  onPick: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onPick(it.id)}
          className={[
            'group relative w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition',
            it.selected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300 hover:shadow',
          ].join(' ')}
        >
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center">
            <Image
              src={it.img}
              alt={it.title}
              width={64}
              height={64}
              className="h-16 w-16 object-contain transition"
              onMouseEnter={(e) => ((e.currentTarget as any).style.filter = 'none')}
              onMouseLeave={(e) => ((e.currentTarget as any).style.filter = it.selected ? 'none' : 'grayscale(100%)')}
              style={{ filter: it.selected ? 'none' : 'grayscale(100%)' }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">{it.title}</span>
            <span
              className={[
                'ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full border transition',
                it.selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-transparent group-hover:text-gray-300',
              ].join(' ')}
            >
              ✓
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function AnimatedReveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(show);

  React.useEffect(() => {
    if (show) setMounted(true);
  }, [show]);

  if (!mounted) return null;

  return (
    <div
      className={[
        'transition-all duration-500',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none',
      ].join(' ')}
    >
      {children}
    </div>
  );
}


/** Pływający pasek statusu (fixed top) */
function TopStatus({ visible, text }: { visible: boolean; text?: string }) {
  if (!visible || !text) return null;
  return (
    <div className="fixed left-1/2 top-3 z-[1000] -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-2 shadow-xl ring-1 ring-black/5 backdrop-blur">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
        </span>
        <span className="text-sm font-medium text-gray-800">{text}</span>
      </div>
    </div>
  );
}

/** Mały edytor B/I/U */
function RichTextSmall({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  const exec = (cmd: 'bold' | 'italic' | 'underline') => {
    document.execCommand(cmd, false);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  React.useEffect(() => {
    if (!ref.current) return;
    if (ref.current.innerHTML !== value) ref.current.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

/** Pozwalamy tylko na <b>, <i>, <u>, <br> */
function sanitizeDescription(html: string): string {
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


