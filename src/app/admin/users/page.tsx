'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminApi';
import { useAuth } from '@/contexts/AuthContext';

type AppUser = {
  id: number;
  name: string | null;
  email: string;
  is_superadmin?: boolean;
};

type UsersResponse = AppUser[] | { data: AppUser[] };

export default function AdminUsersPage() {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await adminFetch<UsersResponse>('/api/v1/admin/users', { token });
      const list = Array.isArray(data) ? data : data?.data || [];
      setUsers(list);
    } catch (e: any) {
      setErr(e?.message || 'Błąd ładowania');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function toggleSuperadmin(u: AppUser) {
    if (!u) return;
    if (me?.id === u.id && u.is_superadmin) {
      alert('Nie możesz zdjąć sobie uprawnień superadmin.');
      return;
    }
    try {
      setSavingId(u.id);
      await adminFetch(`/api/v1/admin/users/${u.id}`, {
        method: 'PATCH',
        token,
        json: { is_superadmin: !u.is_superadmin },
      });
      await load();
    } catch (e: any) {
      alert(e?.message || 'Błąd zapisu');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Użytkownicy</h1>
        <p className="text-sm text-gray-500">Lista kont + zarządzanie uprawnieniami superadmin.</p>
      </header>

      {loading && <div className="text-sm text-gray-500">Ładowanie…</div>}
      {err && <div className="text-sm text-red-600">Błąd: {err}</div>}

      {users && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Nazwa</th>
                <th className="px-4 py-2">E-mail</th>
                <th className="px-4 py-2">Superadmin</th>
                <th className="px-4 py-2 w-0"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">{u.id}</td>
                  <td className="px-4 py-2">{u.name || '—'}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.is_superadmin ? 'Tak' : 'Nie'}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => toggleSuperadmin(u)}
                      disabled={savingId === u.id}
                      className="rounded-md border px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {u.is_superadmin ? 'Zdejmij' : 'Nadaj'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Brak użytkowników.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
