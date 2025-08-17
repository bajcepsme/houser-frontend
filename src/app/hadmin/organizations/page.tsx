// src/app/hadmin/organizations/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminApi';

type OrgRow = {
  id: number;
  name: string;
  slug?: string;
  type?: string;
  website?: string | null;
  phone?: string | null;
  created_at?: string;
};

type Paged<T> = { data?: T[] };

export default function AdminOrganizationsPage() {
  const [items, setItems] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const load = async (query = '') => {
    try {
      setLoading(true);
      setErr(null);
      const res = await adminFetch<Paged<OrgRow> | OrgRow[]>(
        `/v1/admin/organizations?per_page=50${query ? `&search=${encodeURIComponent(query)}` : ''}`
      );
      const array = Array.isArray(res) ? res : (res?.data ?? []);
      setItems(Array.isArray(array) ? array : []);
    } catch (e: any) {
      setErr(e?.message || 'Błąd pobierania.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Organizacje</h1>
        <div className="flex items-center gap-2">
          <input
            className="input-modern"
            placeholder="Szukaj po nazwie…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(q); }}
          />
          <button className="btn-ghost" onClick={() => load(q)}>Szukaj</button>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-600">Ładowanie…</p>}
      {!!err && <p className="text-sm text-red-600">{err}</p>}

      {!loading && items.length === 0 && !err && (
        <p className="text-sm text-gray-500">Brak wyników.</p>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Nazwa</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Typ</th>
                <th className="px-4 py-3 font-medium">WWW</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium">Szczegóły</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-3">{o.id}</td>
                  <td className="px-4 py-3">{o.name}</td>
                  <td className="px-4 py-3 text-gray-600">{o.slug ?? '—'}</td>
                  <td className="px-4 py-3">{o.type ?? '—'}</td>
                  <td className="px-4 py-3">
                    {o.website ? (
                      <a
                        href={o.website.startsWith('http') ? o.website : `https://${o.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        {o.website}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">{o.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Link href={`/hadmin/organizations/${o.id}`} className="btn-ghost btn-sm">
                      Otwórz
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
