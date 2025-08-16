'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/adminApi';
import { useAuth } from '@/contexts/AuthContext';

const LABELS: Record<string,string> = {
  agency: 'Agencja nieruchomości',
  developer: 'Deweloper',
  office: 'Urząd miasta/gminy',
  trustee: 'Syndyk',
};

export default function OnboardingOrganizationPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const { token } = useAuth();

  const initialType = sp.get('type') || 'agency';

  const [name, setName] = useState('');
  const [type, setType] = useState(initialType);
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [invites, setInvites] = useState(''); // lista e-maili po przecinku
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const typeLabel = useMemo(() => LABELS[type] ?? 'Organizacja', [type]);

  async function handleCreate() {
    setErr(null);
    if (!name.trim()) {
      setErr('Podaj nazwę organizacji.');
      return;
    }
    setLoading(true);
    try {
      // 1) utwórz org
      const org = await adminFetch<{organization:{id:number}}>(
        '/api/v1/organizations',
        { method: 'POST', token, json: { name, type, website, phone } }
      );

      // 2) opcjonalne zaproszenia
      const emails = invites
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 3 && s.includes('@'));

      for (const email of emails) {
        try {
          await adminFetch(`/api/v1/organizations/${org.organization.id}/invite`, {
            method: 'POST',
            token,
            json: { email, role: 'agent' },
          });
        } catch (e) {
          // nie blokuj kreatora – najwyżej pokaż alert
          console.warn('Invite failed for', email, e);
        }
      }

      alert('Organizacja utworzona. Jesteś jej administratorem.');
      router.replace('/moje-konto');
    } catch (e: any) {
      setErr(e?.message || 'Błąd podczas tworzenia organizacji.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!LABELS[initialType]) setType('agency');
  }, [initialType]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Utwórz organizację</h1>
      <p className="text-sm text-gray-600">
        Wybrany typ: <span className="font-medium">{typeLabel}</span>
      </p>

      {err && <div className="text-sm text-red-600">Błąd: {err}</div>}

      <div className="space-y-4 rounded-xl border p-4">
        <div>
          <label className="block text-sm font-medium">Nazwa organizacji</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="np. Domator Sp. z o.o."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Typ</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              <option value="agency">Agencja nieruchomości</option>
              <option value="developer">Deweloper</option>
              <option value="office">Urząd miasta/gminy</option>
              <option value="trustee">Syndyk</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Telefon</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="np. 123 456 789"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Strona www</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Zaproś agentów (opcjonalnie)</label>
          <textarea
            value={invites}
            onChange={(e) => setInvites(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            rows={3}
            placeholder="emaile po przecinku, np. anna@firma.pl, jan@firma.pl"
          />
        </div>

        <div className="pt-2">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="rounded-md border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Tworzenie…' : 'Utwórz organizację'}
          </button>
        </div>
      </div>
    </div>
  );
}
