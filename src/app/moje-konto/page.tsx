'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { toAbsoluteUrl } from '@/lib/url';

type Image = { id: number; url: string; order: number };
type Listing = {
  id: number;
  title: string;
  price: number;     // grosze
  area: number;
  address_city: string;
  address_region: string;
  images?: Image[];
};

export default function MyAccountPage() {
  const { user, isLoading } = useAuthGuard();
  const { token } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/my-listings`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Nie udało się pobrać ogłoszeń');

        const payload = await res.json();
        const data: Listing[] = Array.isArray(payload?.data) ? payload.data : payload;

        const normalized: Listing[] = (data || []).map((l: any) => ({
          ...l,
          images: Array.isArray(l.images)
            ? l.images
                .map((img: any, i: number) => ({
                  id: Number(img?.id ?? i),
                  url: toAbsoluteUrl(
                    img?.url ??
                      img?.full_url ??
                      img?.image_url ??
                      img?.original_url ??
                      img?.path ??
                      img?.file_path ??
                      img?.filename ??
                      ''
                  ),
                  order: Number(img?.order ?? i),
                }))
                .sort((a: Image, b: Image) => (a.order ?? 0) - (b.order ?? 0))
            : [],
        }));

        setItems(normalized);
      } catch (e: any) {
        setError(e.message || 'Błąd');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, token]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm('Na pewno usunąć to ogłoszenie?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/listings/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Nie udało się usunąć ogłoszenia');
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      alert('Błąd podczas usuwania.');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading || !user) return <p className="p-10 text-center">Ładowanie…</p>;

  return (
    <main className="container mx-auto max-w-4xl p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Moje Ogłoszenia</h1>

      {loading && <p className="text-center text-gray-600">Ładowanie…</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      <ul className="space-y-4">
        {items.map((l) => {
          const main = l.images && l.images.length > 0 ? l.images[0] : null;
          return (
            <li key={l.id} className="flex items-center gap-4 bg-white border rounded-xl p-4 shadow-sm">
              <div className="w-28 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {main?.url ? (
                  <img src={main.url} alt={l.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-xs text-gray-500">Brak zdjęcia</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link href={`/ogloszenia/${l.id}`} className="font-semibold line-clamp-1 hover:underline">
                  {l.title}
                </Link>
                <div className="text-sm text-gray-600 line-clamp-1">
                  {l.address_city}, {l.address_region}
                </div>
                <div className="text-sm mt-1">
                  <span className="font-semibold text-blue-600">
                    {(l.price / 100).toLocaleString('pl-PL')} PLN
                  </span>{' '}
                  • <span>{l.area} m²</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/ogloszenia/${l.id}/edytuj`} className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50">
                  Edytuj
                </Link>
                <button
                  onClick={() => handleDelete(l.id)}
                  disabled={deletingId === l.id}
                  className="px-3 py-1.5 rounded-md border text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === l.id ? 'Usuwanie…' : 'Usuń'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {items.length === 0 && !loading && (
        <div className="bg-white border rounded-2xl p-10 text-center text-gray-600">
          Nie masz jeszcze żadnych ogłoszeń.
        </div>
      )}
    </main>
  );
}
