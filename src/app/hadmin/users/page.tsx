'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/adminApi';

type UserRow = {
  id: number;
  name: string;
  email: string;
  is_superadmin?: boolean;
  created_at?: string;
};

type Paged<T> = {
  data?: T[];
  total?: number;
  per_page?: number;
  current_page?: number;
};

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async (query = '') => {
    try {
      setLoading(true);
      setErr(null);
      const res = await adminFetch<Paged<UserRow> | UserRow[]>(
        `/v1/admin/users?per_page=50${query ? `&search=${encodeURIComponent(query)}` : ''}`
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

  const filtered = useMemo(() => {
    if (!q) return items;
    const needle = q.toLowerCase();
    return items.filter(u =>
      (u.name || '').toLowerCase().includes(needle) ||
      (u.email || '').toLowerCase().includes(needle)
    );
  }, [items, q]);

  const toggleSA = async (u: UserRow) => {
    try {
      setBusyId(u.id);
      await adminFetch(`/v1/admin/users/${u.id}`, {
        method: 'PATCH',
        json: { is_superadmin: !u.is_superadmin },
      });
      setItems(prev => prev.map(x => x.id === u.id ? { ...x, is_superadmin: !u.is_superadmin } : x));
    } catch (e: any) {
      alert(e?.message || 'Nie udało się zapisać.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Użytkownicy</h1>
        <div className="flex items-center gap-2">
          <input
            className="input-modern"
            placeholder="Szukaj po imieniu lub e-mailu…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(q); }}
          />
          <button className="btn-ghost" onClick={() => load(q)}>Szukaj</button>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-600">Ładowanie…</p>}
      {!!err && <p className="text-sm text-red-600">{err}</p>}

      {!loading && filtered.length === 0 && !err && (
        <p className="text-sm text-gray-500">Brak wyników.</p>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Nazwa</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Superadmin</th>
                <th className="px-4 py-3 font-medium">Utworzono</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3">{u.id}</td>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3 text-gray-700">{u.email}</td>
                  <td className="px-4 py-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!u.is_superadmin}
                        disabled={busyId === u.id}
                        onChange={() => toggleSA(u)}
                      />
                      <span className="text-xs text-gray-600">{u.is_superadmin ? 'TAK' : 'NIE'}</span>
                    </label>
                  </td>
                  <td className="px-4 py-3">{u.created_at?.slice(0,10) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
