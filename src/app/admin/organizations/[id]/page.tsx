'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminFetch } from '@/lib/adminApi';
import { useAuth } from '@/contexts/AuthContext';

type Member = { id:number; name:string; email:string; pivot:{ role:string } };
type Invitation = { id:number; email:string; role:string; token:string|null; invited_by:number|null; created_at:string };

export default function AdminOrgMembersPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('agent');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const m = await adminFetch<Member[]>(`/api/v1/organizations/${id}/members`, { token });
      const i = await adminFetch<Invitation[]>(`/api/v1/organizations/${id}/invitations`, { token });
      setMembers(m);
      setInvites(i);
    } catch (e:any) {
      setErr(e?.message || 'Błąd ładowania');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function invite() {
    if (!email.includes('@')) return alert('Podaj poprawny e-mail');
    try {
      await adminFetch(`/api/v1/organizations/${id}/invite`, {
        method: 'POST', token, json: { email, role }
      });
      setEmail('');
      await load();
    } catch (e:any) {
      alert(e?.message || 'Błąd wysyłki zaproszenia');
    }
  }

  async function revoke(invId:number) {
    if (!confirm('Usunąć to zaproszenie?')) return;
    try {
      await adminFetch(`/api/v1/organizations/${id}/invite/${invId}`, {
        method: 'DELETE', token
      });
      await load();
    } catch (e:any) {
      alert(e?.message || 'Błąd usuwania zaproszenia');
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Organizacja #{id} — członkowie</h1>
        <p className="text-sm text-gray-500">Zarządzanie członkami i zaproszeniami.</p>
      </header>

      {loading && <div className="text-sm text-gray-500">Ładowanie…</div>}
      {err && <div className="text-sm text-red-600">Błąd: {err}</div>}

      {!loading && (
        <>
          <section className="rounded-lg border">
            <div className="border-b bg-gray-50 px-4 py-2 font-medium">Członkowie</div>
            <table className="min-w-full text-sm">
              <thead><tr className="text-left">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Imię i nazwisko</th>
                <th className="px-4 py-2">E-mail</th>
                <th className="px-4 py-2">Rola</th>
              </tr></thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} className="border-t">
                    <td className="px-4 py-2">{m.id}</td>
                    <td className="px-4 py-2">{m.name}</td>
                    <td className="px-4 py-2">{m.email}</td>
                    <td className="px-4 py-2">{m.pivot.role}</td>
                  </tr>
                ))}
                {members.length===0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Brak członków.</td></tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="rounded-lg border">
            <div className="border-b bg-gray-50 px-4 py-2 font-medium">Zaproszenia (oczekujące)</div>
            <div className="p-4 flex items-end gap-2">
              <div>
                <label className="block text-xs text-gray-500">E-mail</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} className="rounded-md border px-3 py-2 text-sm" placeholder="anna@firma.pl" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Rola</label>
                <select value={role} onChange={e=>setRole(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <button onClick={invite} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">Zaproś</button>
            </div>

            <table className="min-w-full text-sm">
              <thead><tr className="text-left">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">E-mail</th>
                <th className="px-4 py-2">Rola</th>
                <th className="px-4 py-2">Utworzono</th>
                <th className="px-4 py-2 w-0"></th>
              </tr></thead>
              <tbody>
                {invites.map(i => (
                  <tr key={i.id} className="border-t">
                    <td className="px-4 py-2">{i.id}</td>
                    <td className="px-4 py-2">{i.email}</td>
                    <td className="px-4 py-2">{i.role}</td>
                    <td className="px-4 py-2">{i.created_at?.slice(0,19).replace('T',' ')}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={()=>revoke(i.id)} className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50">Usuń</button>
                    </td>
                  </tr>
                ))}
                {invites.length===0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Brak zaproszeń.</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
