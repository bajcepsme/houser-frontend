'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { toAbsoluteUrl } from '@/lib/url';
import {
  User, Phone, AtSign, Globe, Camera, Trash2, Save, Loader2,
  Facebook, Instagram, Twitter, Linkedin, Youtube, Link as LinkIcon,
} from 'lucide-react';

// ładniejszy, ciemnoszary default avatar (data-URI)
const DEFAULT_AVATAR =
  `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2c313a"/>
      <stop offset="1" stop-color="#1e222a"/>
    </linearGradient>
  </defs>
  <circle cx="128" cy="128" r="124" fill="url(#g)"/>
  <circle cx="128" cy="128" r="124" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="8"/>
  <!-- głowa -->
  <circle cx="128" cy="102" r="36" fill="#eef2f6"/>
  <!-- tors / ramiona -->
  <path d="M64 190c10-28 36-44 64-44s54 16 64 44v10H64z" fill="#d7dde6"/>
</svg>
`)}`;

const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

/** avatars/xxx.jpg  ->  {API}/storage/avatars/xxx.jpg */
function avatarPathToUrl(val?: string | null) {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;
  if (/^(https?:|data:|blob:)/i.test(s)) return s;
  if (/^avatars\//i.test(s)) return `${apiBase}/storage/${s.replace(/^\/+/, '')}`;
  if (/^storage\//i.test(s)) return `${apiBase}/${s.replace(/^\/+/, '')}`;
  return toAbsoluteUrl(s);
}

function withScheme(u: string) {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}
function phoneDigits(p: string) {
  return (p || '').replace(/\D+/g, '').slice(0, 15);
}
function nicePhone(p: string) {
  const d = phoneDigits(p);
  if (!d) return '';
  return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

type ProfileDTO = {
  name?: string;
  email?: string;
  phone?: string | null;
  bio?: string | null;
  website?: string | null;
  social?: {
    facebook?: string | null;
    instagram?: string | null;
    twitter?: string | null;
    linkedin?: string | null;
    youtube?: string | null;
  }
  avatar?: string | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthGuard();
  const { token, setUser } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');

  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // załaduj z kontekstu
  useEffect(() => {
    if (!user) return;
    setDisplayName(user.name || '');
    setEmail(user.email || '');
    setPhone((user as any)?.phone || (user as any)?.phone_number || '');
    setBio((user as any)?.bio || '');
    setWebsite((user as any)?.website || '');

    const social = (user as any)?.social || {};
    setFacebookUrl(social?.facebook || '');
    setInstagramUrl(social?.instagram || '');
    setTwitterUrl(social?.twitter || '');
    setLinkedinUrl(social?.linkedin || '');
    setYoutubeUrl(social?.youtube || '');

    setAvatarUrl(avatarPathToUrl((user as any)?.avatar || null));
  }, [user]);

  const hasCustomAvatar = !!(avatarUrl && !avatarUrl.startsWith('data:image/svg+xml'));

  const avatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return avatarUrl || null;
  }, [avatarFile, avatarUrl]);

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) {
      setMsg('Wybierz plik graficzny (JPEG/PNG/WebP).');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setMsg('Maksymalny rozmiar avatara to 5 MB.');
      return;
    }
    setAvatarFile(f);
  };

  /** dociągnij świeżego usera z API po zapisie */
  const refetchUser = async () => {
    if (!token) return;
    const res = await fetch(`${apiBase}/api/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (res.ok) {
      const fresh = await res.json();
      setUser?.(fresh);
      setAvatarUrl(avatarPathToUrl(fresh?.avatar));
    }
  };

  const removeAvatar = async () => {
    setMsg(null);
    try {
      if (token) {
        await fetch(`${apiBase}/api/v1/user/avatar`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        await refetchUser();
      }
      setAvatarFile(null);
    } catch {
      /* noop */
    }
  };

  const saveAll = async () => {
    if (!token) return;
    setSaving(true);
    setMsg(null);

    // 1) upload avatara (opcjonalnie)
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);

        const up = await fetch(`${apiBase}/api/v1/user/avatar`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }, // UWAGA: bez Content-Type!
          body: fd,
        });

        if (!up.ok) throw new Error('Upload avatara nie powiódł się');

        const data = await up.json().catch(() => ({}));
        const uploadedRawPath   = data?.avatar || data?.path || null;      // np. "avatars/abc.jpg"
        const uploadedPublicUrl = data?.url    || data?.full_url || null;  // np. "http://.../storage/avatars/abc.jpg"

        if (uploadedPublicUrl) setAvatarUrl(uploadedPublicUrl); // natychmiastowy podgląd
        if (uploadedRawPath)   setUser?.((u: any) => ({ ...u, avatar: uploadedRawPath }));

        setAvatarFile(null);
      }
    } catch {
      // nie blokuj zapisu reszty pól
    }

    // 2) zapis pól tekstowych
    const payload: ProfileDTO = {
      name: displayName.trim(),
      phone: phoneDigits(phone),
      bio: bio.trim() || null,
      website: website ? withScheme(website.trim()) : null,
      social: {
        facebook: facebookUrl ? withScheme(facebookUrl.trim()) : null,
        instagram: instagramUrl ? withScheme(instagramUrl.trim()) : null,
        twitter: twitterUrl ? withScheme(twitterUrl.trim()) : null,
        linkedin: linkedinUrl ? withScheme(linkedinUrl.trim()) : null,
        youtube: youtubeUrl ? withScheme(youtubeUrl.trim()) : null,
      },
    };

    let ok = false;
    try {
      const res = await fetch(`${apiBase}/api/v1/user`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      ok = res.ok;
      if (ok) await refetchUser();
    } catch {
      ok = false;
    }

    setSaving(false);
    setMsg(ok ? 'Zapisano zmiany.' : 'Nie udało się zapisać zmian.');

    // TWARDY REFRESH po udanym zapisie – gwarantuje świeży stan wszędzie (w tym w headerze)
    if (ok && typeof window !== 'undefined') {
      // Krótka pauza, aby użytkownik zobaczył komunikat
      setTimeout(() => {
        window.location.reload();
      }, 150);
    }
  };

  if (isLoading || !user) {
    return <main className="container-page py-10 text-center">Ładowanie…</main>;
  }

  return (
    <main className="container-page py-8 md:py-12 space-y-6">
      {/* Header – gradient + avatar */}
      <section
        className="relative overflow-hidden rounded-2xl border border-gray-200/70 shadow-sm"
        style={{
          background:
            'linear-gradient(135deg, rgba(59,130,246,.10) 0%, rgba(16,185,129,.10) 50%, rgba(59,130,246,.10) 100%)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(80%_60%_at_10%_-10%,rgba(59,130,246,.18),transparent),radial-gradient(60%_50%_at_100%_0%,rgba(16,185,129,.20),transparent)]" />
        <div className="relative p-6 md:p-8 flex items-start gap-5">
          {/* Avatar + przyciski */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden ring-2 ring-white/60 shadow-md bg-white/60 backdrop-blur">
              <Image
                src={avatarPreview || avatarUrl || DEFAULT_AVATAR}
                alt="Avatar"
                width={112}
                height={112}
                className="w-full h-full object-cover"
                priority
                unoptimized
              />
            </div>

            {/* Przyciski — wyśrodkowane pod obrazkiem, odstęp ~20px */}
            <div className="mt-5 w-24 md:w-28 flex items-center justify-center">
              {/* Pokaż WYBIERZ, gdy nie ma własnego avatara i nie wybrano pliku */}
              {!(avatarPreview || hasCustomAvatar) && (
                <label
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-gray-800 text-xs ring-1 ring-gray-300 shadow-sm hover:bg-gray-50 cursor-pointer transition active:scale-[.98]"
                  title="Wybierz avatar"
                >
                  <Camera className="h-4 w-4" />
                  <span>Wybierz</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
                </label>
              )}

              {/* Pokaż USUŃ, gdy jest własny avatar albo wybrano plik */}
              {(avatarPreview || hasCustomAvatar) && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs shadow hover:bg-rose-600 transition active:scale-[.98]"
                  title="Usuń avatar"
                >
                  <Trash2 className="h-4 w-4" />
                  Usuń
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Ustawienia profilu</h1>
            <p className="text-gray-600 mt-1">
              Zaktualizuj dane widoczne na Twojej stronie profilu i w ogłoszeniach.
            </p>
            {msg && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-1.5 text-sm text-gray-800 ring-1 ring-gray-200 shadow-sm">
                {msg}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Dane podstawowe */}
      <section className="card-modern p-5 md:p-6 space-y-4">
        <h2 className="text-[17px] md:text-lg font-semibold tracking-tight">Dane podstawowe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Nazwa wyświetlana</label>
            <div className="input-group">
              <input
                className="input-modern"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="np. bajcepsme"
              />
              <span className="input-suffix"><User className="h-4 w-4" /></span>
            </div>
          </div>

          <div>
            <label className="form-label">E-mail (logowanie)</label>
            <div className="input-group">
              <input className="input-modern input-readonly" value={email} readOnly />
              <span className="input-suffix"><AtSign className="h-4 w-4" /></span>
            </div>
          </div>

          <div>
            <label className="form-label">Telefon</label>
            <div className="input-group">
              <input
                className="input-modern"
                inputMode="numeric"
                value={nicePhone(phone)}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="np. 600 700 800"
              />
              <span className="input-suffix"><Phone className="h-4 w-4" /></span>
            </div>
          </div>

          <div>
            <label className="form-label">Strona www</label>
            <div className="input-group">
              <input
                className="input-modern"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="np. twojadomena.pl"
              />
              <span className="input-suffix"><Globe className="h-4 w-4" /></span>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="form-label">Bio</label>
            <textarea
              className="input-modern min-h-[120px] resize-y"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Krótko o Tobie…"
            />
          </div>
        </div>
      </section>

      {/* Linki społecznościowe */}
      <section className="card-modern p-5 md:p-6 space-y-4">
        <h2 className="text-[17px] md:text-lg font-semibold tracking-tight">Profile społecznościowe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label flex items-center gap-2"><Facebook className="h-4 w-4 text-[#1877f2]" /> Facebook</label>
            <div className="input-group">
              <input className="input-modern" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="facebook.com/twoj-profil" />
              <span className="input-suffix"><LinkIcon className="h-4 w-4" /></span>
            </div>
          </div>
          <div>
            <label className="form-label flex items-center gap-2"><Instagram className="h-4 w-4 text-[#e1306c]" /> Instagram</label>
            <div className="input-group">
              <input className="input-modern" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="instagram.com/twoj-profil" />
              <span className="input-suffix"><LinkIcon className="h-4 w-4" /></span>
            </div>
          </div>
          <div>
            <label className="form-label flex items-center gap-2"><Twitter className="h-4 w-4 text-black" /> X / Twitter</label>
            <div className="input-group">
              <input className="input-modern" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="x.com/twoj-profil" />
              <span className="input-suffix"><LinkIcon className="h-4 w-4" /></span>
            </div>
          </div>
          <div>
            <label className="form-label flex items-center gap-2"><Linkedin className="h-4 w-4 text-[#0a66c2]" /> LinkedIn</label>
            <div className="input-group">
              <input className="input-modern" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/in/twoj-profil" />
              <span className="input-suffix"><LinkIcon className="h-4 w-4" /></span>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="form-label flex items-center gap-2"><Youtube className="h-4 w-4 text-[#ff0000]" /> YouTube</label>
            <div className="input-group">
              <input className="input-modern" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="youtube.com/@twoj-kanal" />
              <span className="input-suffix"><LinkIcon className="h-4 w-4" /></span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={saveAll}
            disabled={saving}
            className="btn-primary !px-5 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Zapisz zmiany
          </button>
        </div>
      </section>
    </main>
  );
}
