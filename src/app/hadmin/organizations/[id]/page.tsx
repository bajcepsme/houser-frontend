// src/app/hadmin/organizations/[id]/page.tsx
'use client';

import * as React from 'react';
import { use } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import { adminFetch } from '@/lib/adminApi';

type Org = {
  id: number;
  name: string;
  slug?: string | null;
  type?: string | null;       // 'agency' | 'builder' | ...
  website?: string | null;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function AdminOrgShowPage(props: { params: Promise<{ id: string }> }) {
  // ✅ Rozpakowanie params (Next 15: params to Promise)
  const { id } = use(props.params);
  const orgId = Number(id);

  const [org, setOrg] = React.useState<Org | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  // form state
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      // Wymagany endpoint GET /api/v1/admin/organizations/{org}
      const data = await adminFetch<Org>(`/v1/admin/organizations/${orgId}`);
      setOrg(data);
      setName(data.name ?? '');
      setType(data.type ?? '');
      setWebsite(data.website ?? '');
      setPhone(data.phone ?? '');
    } catch (e: any) {
      setErr(e?.message || 'Błąd pobierania.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  React.useEffect(() => {
    if (!Number.isFinite(orgId)) return;
    load();
  }, [orgId, load]);

  const onSave = async () => {
    if (!org) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await adminFetch(`/v1/admin/organizations/${org.id}`, {
        method: 'PATCH',
        json: {
          name: name.trim(),
          type: type || null,
          website: website?.trim() || null,
          phone: phone?.trim() || null,
        },
      });
      setSaveMsg('Zapisano.');
      // odśwież widok po zapisie
      load();
    } catch (e: any) {
      setSaveMsg(e?.message || 'Nie udało się zapisać zmian.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminGuard>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Organizacja #{orgId}</h1>
          <Link href="/hadmin/organizations" className="btn-ghost">← Wróć do listy</Link>
        </div>

        {loading && <p className="text-sm text-gray-600">Ładowanie…</p>}
        {!!err && <p className="text-sm text-red-600">{err}</p>}

        {!loading && org && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dane podstawowe */}
            <section className="lg:col-span-2 card-modern p-5 md:p-6 space-y-4">
              <h2 className="text-lg font-semibold">Dane organizacji</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nazwa</label>
                  <input
                    className="input-modern"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Typ</label>
                  <select
                    className="input-modern"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="">— wybierz —</option>
                    <option value="agency">Agencja</option>
                    <option value="builder">Deweloper</option>
                    <option value="owner">Właściciel</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">WWW</label>
                  <input
                    className="input-modern"
                    placeholder="np. https://twoja-strona.pl"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Telefon</label>
                  <input
                    className="input-modern"
                    placeholder="np. 500 600 700"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="btn-primary"
                  onClick={onSave}
                  disabled={saving}
                  title="Zapisz zmiany"
                >
                  {saving ? 'Zapisywanie…' : 'Zapisz'}
                </button>
                {!!saveMsg && <span className="text-sm text-gray-600">{saveMsg}</span>}
              </div>
            </section>

            {/* Info boczne */}
            <aside className="card-modern p-5 md:p-6 space-y-2">
              <h3 className="font-semibold">Metadane</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <div><span className="text-gray-500">ID:</span> {org.id}</div>
                <div><span className="text-gray-500">Slug:</span> {org.slug || '—'}</div>
                <div><span className="text-gray-500">Utworzono:</span> {org.created_at || '—'}</div>
                <div><span className="text-gray-500">Zaktualizowano:</span> {org.updated_at || '—'}</div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
