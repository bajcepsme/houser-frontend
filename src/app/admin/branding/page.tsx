// src/app/admin/branding/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/adminApi';
import { useAuth } from '@/contexts/AuthContext';
import {
  BrandSettings,
  applyBrandToHtml,
  loadBrandFromLocalStorage,
  saveBrandToLocalStorage,
} from '@/lib/brand';

type BrandResponse =
  | BrandSettings
  | { data: BrandSettings }    // gdy backend zwraca w data
  | Record<string, any>;       // fallback (np. { primary: '#...', secondary: '#...' })

function normalizeBrand(resp: BrandResponse): BrandSettings {
  const raw: any = (resp && (resp as any).data) ? (resp as any).data : resp || {};
  // Obsługa potencjalnych nazw kluczy z tabeli settings (brand.primary itd.)
  const mapped: BrandSettings = {
    primary: raw.primary ?? raw['brand.primary'] ?? '#111111',
    secondary: raw.secondary ?? raw['brand.secondary'] ?? '#666666',
    background: raw.background ?? raw['brand.background'] ?? '#ffffff',
    logo_url: raw.logo_url ?? raw['brand.logo_url'] ?? null,
  };
  return mapped;
}

export default function BrandingPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [primary, setPrimary] = useState('#111111');
  const [secondary, setSecondary] = useState('#666666');
  const [background, setBackground] = useState('#ffffff');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const previewStyle = useMemo(
    () => ({
      background: background || '#ffffff',
      borderColor: '#e5e7eb',
    }),
    [background]
  );

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      // Jeśli backend nie ma jeszcze publicznego endpointu, możemy wczytać z admin:
      const resp = await adminFetch<BrandResponse>('/api/v1/admin/settings/brand', { token });
      const brand = normalizeBrand(resp);
      setPrimary(brand.primary || '#111111');
      setSecondary(brand.secondary || '#666666');
      setBackground(brand.background || '#ffffff');
      setLogoUrl(brand.logo_url || null);

      // natychmiastowa aplikacja w UI:
      applyBrandToHtml(brand);
      saveBrandToLocalStorage(brand);
    } catch (e: any) {
      // Brak dostępu / endpointu? Spróbujmy localStorage jako fallback
      const ls = loadBrandFromLocalStorage();
      if (ls) {
        setPrimary(ls.primary || '#111111');
        setSecondary(ls.secondary || '#666666');
        setBackground(ls.background || '#ffffff');
        setLogoUrl(ls.logo_url || null);
        applyBrandToHtml(ls);
      } else {
        setErr(e?.message || 'Błąd ładowania');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    setErr(null);
    try {
      // 1) Zapis kolorów
      const payload = {
        primary,
        secondary,
        background,
      };
      await adminFetch('/api/v1/admin/settings/brand', {
        method: 'POST',
        token,
        json: payload,
      });

      // 2) Upload logo (opcjonalnie)
      let uploadedLogoUrl = logoUrl || null;
      if (logoFile) {
        const form = new FormData();
        form.append('logo', logoFile);
        const resp = await adminFetch<{ url?: string; logo_url?: string }>('/api/v1/admin/settings/logo', {
          method: 'POST',
          token,
          formData: form,
        });
        uploadedLogoUrl = resp.logo_url || resp.url || uploadedLogoUrl;
        setLogoUrl(uploadedLogoUrl || null);
      }

      // 3) Natychmiastowa aplikacja + persist
      const brand = { primary, secondary, background, logo_url: uploadedLogoUrl || null };
      applyBrandToHtml(brand);
      saveBrandToLocalStorage(brand);

      alert('Zapisano branding.');
    } catch (e: any) {
      setErr(e?.message || 'Błąd zapisu');
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Branding</h1>
        <p className="text-sm text-gray-500">
          Ustal kolory i logo. Zmiany po zapisie są od razu widoczne (CSS variables).
        </p>
      </header>

      {loading && <div className="text-sm text-gray-500">Ładowanie…</div>}
      {err && <div className="text-sm text-red-600">Błąd: {err}</div>}

      {!loading && (
        <>
          <section className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <label className="block text-sm font-medium">Primary</label>
                <input
                  type="color"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  className="h-10 w-20 cursor-pointer rounded border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Secondary</label>
                <input
                  type="color"
                  value={secondary}
                  onChange={(e) => setSecondary(e.target.value)}
                  className="h-10 w-20 cursor-pointer rounded border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Background</label>
                <input
                  type="color"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="h-10 w-20 cursor-pointer rounded border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Logo (PNG/SVG)</label>
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm"
                />
                {logoUrl && (
                  <div className="mt-2">
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                )}
              </div>
              <div>
                <button
                  onClick={handleSave}
                  className="rounded-md border px-4 py-2 hover:bg-gray-50"
                >
                  Zapisz
                </button>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="text-sm text-gray-500">Podgląd komponentów</div>
              <div
                className="rounded-lg border p-4"
                style={previewStyle}
              >
                <div
                  className="inline-block rounded-md px-3 py-2 text-white"
                  style={{ background: primary }}
                >
                  Primary button
                </div>
                <div className="h-3" />
                <div
                  className="inline-block rounded-md px-3 py-2 text-white"
                  style={{ background: secondary }}
                >
                  Secondary button
                </div>
                <div className="h-3" />
                <div className="text-sm text-gray-700">
                  Tło tej karty to „Background”.
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <div className="text-sm text-gray-500 mb-2">Użyte CSS variables (globalnie):</div>
            <code className="block whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border">
              {`:root {
  --brand-primary: ${primary};
  --brand-secondary: ${secondary};
  --brand-bg: ${background};
  /* --brand-logo-url: ${logoUrl || 'none'}; */
}`}
            </code>
          </section>
        </>
      )}
    </div>
  );
}