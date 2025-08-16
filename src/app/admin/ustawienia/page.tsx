'use client';
import { useEffect, useState } from 'react';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useAuth } from '@/contexts/AuthContext';

type UserRow = { id:number; name:string; email:string; is_superadmin:boolean; updated_at?:string };

export default function AdminUsersPage() {
  useAdminGuard();
  const { token } = useAuth();
  const [items, setItems] = useState<UserRow[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${api}/api/v1/admin/users?per_page=50&search=${encodeURIComponent(q)}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await res.json();
      setItems(data?.data || data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  const toggleSA = async (u: UserRow) => {
    if (!token) return;
    const api = process.env.NEXT_PUBLIC_API_URL;
    await fetch(`${api}/api/v1/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_superadmin: !u.is_superadmin }),
    });
    load();
  };

  return (
    <section className="card-modern p-4 space-y-3">
      <div className="flex gap-2">
        <input className="input-modern" placeholder="Szukaj (imię/e-mail)" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="btn-primary px-4 py-2 rounded-xl" onClick={load} disabled={loading}>Szukaj</button>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">ID</th>
              <th className="py-2 pr-4">Imię i nazwisko</th>
              <th className="py-2 pr-4">E-mail</th>
              <th className="py-2 pr-4">Superadmin</th>
              <th className="py-2 pr-4">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {items.map(u=>(
              <tr key={u.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{u.id}</td>
                <td className="py-2 pr-4">{u.name}</td>
                <td className="py-2 pr-4">{u.email}</td>
                <td className="py-2 pr-4">{u.is_superadmin ? 'TAK' : '—'}</td>
                <td className="py-2 pr-4">
                  <button onClick={()=>toggleSA(u)} className="inline-flex rounded-xl border px-3 py-1 hover:bg-gray-50">
                    {u.is_superadmin ? 'Zabierz SA' : 'Nadaj SA'}
                  </button>
                </td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr><td colSpan={5} className="py-4 text-gray-500">Brak wyników</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
