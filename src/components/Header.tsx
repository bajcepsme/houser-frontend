'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Plus, Menu, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toAbsoluteUrl } from '@/lib/url';
import { loadBrandFromLocalStorage } from '@/lib/brand';

function NavLink({ href, label }: { href: string; label: string }) {
  const path = usePathname();
  const active = path === href || (href !== '/' && path.startsWith(href));
  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center rounded-full px-3.5 py-2 text-sm transition',
        active
          ? 'bg-gray-900 text-white shadow-sm'
          : 'border border-gray-200 text-gray-700 bg-white hover:bg-gray-50',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

const DEFAULT_AVATAR_DARK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#1f2937"/><stop offset="1" stop-color="#111827"/>
      </linearGradient></defs>
      <circle cx="48" cy="48" r="48" fill="url(#g)"/>
      <circle cx="48" cy="38" r="16" fill="#e5e7eb"/>
      <path d="M16 78c6-14 18-22 32-22s26 8 32 22" fill="#e5e7eb"/>
    </svg>`
  );

function resolveAssetSrc(raw?: string | null): string | null {
  if (!raw || !raw.trim()) return null;
  let s = raw.trim();
  if (/^(data:|blob:|https?:\/\/)/i.test(s)) return s;
  s = s.replace(/^\/+/, '');
  if (s.startsWith('logos/')) s = `storage/${s}`;
  return toAbsoluteUrl(`/${s}`);
}

function resolveAvatarSrc(raw?: string | null): string {
  if (!raw || !raw.trim()) return DEFAULT_AVATAR_DARK;
  let s = raw.trim();
  if (/^(data:|blob:|https?:\/\/)/i.test(s)) return s;
  s = s.replace(/^\/+/, '');
  if (s.startsWith('avatars/')) s = `storage/${s}`;
  return toAbsoluteUrl(`/${s}`);
}

function Avatar({
  name,
  photoUrl,
  size = 32,
  cacheKey,
}: {
  name?: string | null;
  photoUrl?: string | null;
  size?: number;
  cacheKey?: string | number | null;
}) {
  const [src, setSrc] = React.useState<string>(() =>
    resolveAvatarSrc(photoUrl)
  );
  React.useEffect(() => {
    setSrc(resolveAvatarSrc(photoUrl));
  }, [photoUrl]);

  const isDataOrBlob = /^(data:|blob:)/i.test(src);
  const needsBuster =
    !isDataOrBlob && (/^https?:\/\//i.test(src) || src.startsWith('/'));
  const finalSrc =
    needsBuster && cacheKey != null
      ? `${src}${src.includes('?') ? '&' : '?'}v=${encodeURIComponent(
          String(cacheKey)
        )}`
      : src;

  const isDefault = src.startsWith('data:');
  return (
    <img
      key={finalSrc}
      src={finalSrc}
      alt={name || 'Użytkownik'}
      className={[
        'rounded-full object-cover ring-1 ring-black/5',
        isDefault ? '' : 'bg-white',
      ].join(' ')}
      style={{ width: size, height: size }}
      onError={() => setSrc(DEFAULT_AVATAR_DARK)}
    />
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [brand, setBrand] = React.useState<{
    title?: string | null;
    logo_url?: string | null;
    updated_at?: any;
  } | null>(null);

  React.useEffect(() => {
    setBrand(loadBrandFromLocalStorage() as any);
    const onBrandUpdated = () => {
      // WAŻNE: odkładamy setState do następnej klatki
      requestAnimationFrame(() => {
        setBrand(loadBrandFromLocalStorage() as any);
      });
    };
    window.addEventListener('houser:brand:updated', onBrandUpdated);
    return () =>
      window.removeEventListener('houser:brand:updated', onBrandUpdated);
  }, []);

  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) =>
      e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* LEFT: logo + nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            {(() => {
              const src = resolveAssetSrc(brand?.logo_url);
              if (src) {
                const needsBuster = !/^(data:|blob:)/i.test(src);
                const finalSrc = needsBuster
                  ? `${src}${src.includes('?') ? '&' : '?'}v=${encodeURIComponent(
                      String(
                        brand?.updated_at ?? brand?.logo_url ?? '1'
                      )
                    )}`
                  : src;
                return (
                  <div className="logo-frame">
                    <img
                      src={finalSrc}
                      alt={brand?.title || 'Houser'}
                      className="brand-logo"
                    />
                  </div>
                );
              }
              return (
                <span className="text-xl font-extrabold tracking-tight text-gray-900">
                  <span className="text-brand-600">
                    {(brand?.title || 'houser').toLowerCase()}
                  </span>
                  .pl
                </span>
              );
            })()}
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <NavLink href="/ogloszenia" label="Ogłoszenia" />
            <NavLink href="/kategorie" label="Kategorie" />
            <NavLink href="/nowe-oferty" label="Nowe oferty" />
            <NavLink href="/blog" label="Blog" />
            {user && (
              <NavLink href="/moje-ogloszenia" label="Moje ogłoszenia" />
            )}
          </nav>
        </div>

        {/* RIGHT: CTA + user */}
        <div className="flex items-center gap-2">
          <Link
            href="/dodaj-ogloszenie"
            className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 hover:shadow-hover"
          >
            <Plus className="mr-2 h-4 w-4" />
            Dodaj ogłoszenie
          </Link>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="group inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-2 py-1.5 pr-2.5 transition hover:bg-gray-50"
              >
                <Avatar
                  name={user?.name}
                  photoUrl={(user as any)?.avatar}
                  size={28}
                  cacheKey={(user as any)?.updated_at || (user as any)?.avatar}
                />
                <span className="hidden text-sm text-gray-800 sm:inline">
                  {user?.name || 'Konto'}
                </span>
              </button>

              {open && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setOpen(false)}
                    aria-hidden
                  />
                  <div
                    className="card absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl bg-white/90 shadow-soft ring-1 ring-black/5 backdrop-blur"
                    role="menu"
                    aria-label="menu użytkownika"
                  >
                    <div className="px-3 py-2 text-xs text-gray-500">
                      Twoje konto
                    </div>
                    <button
                      className="dropdown-item inline-flex items-center gap-2 text-gray-800"
                      onClick={() => {
                        setOpen(false);
                        router.push('/moje-konto');
                      }}
                    >
                      <User className="h-4 w-4" /> Moje konto
                    </button>
                    <button
                      className="dropdown-item inline-flex items-center gap-2 text-gray-800"
                      onClick={() => {
                        setOpen(false);
                        router.push('/ustawienia');
                      }}
                    >
                      <Settings className="h-4 w-4" /> Ustawienia
                    </button>
                    <div className="my-1 h-px bg-gray-100" />
                    <button
                      className="dropdown-item inline-flex items-center gap-2 text-coral-600 hover:bg-red-50/50"
                      onClick={async () => {
                        setOpen(false);
                        await logout?.();
                        router.push('/');
                      }}
                    >
                      <LogOut className="h-4 w-4" /> Wyloguj
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/logowanie"
              className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800 transition hover:bg-gray-50"
            >
              <User className="mr-2 h-4 w-4" />
              Zaloguj się
            </Link>
          )}

          <button className="md:hidden rounded-xl border border-gray-200 p-2 hover:bg-gray-50">
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Scoped style tylko dla logotypu */}
      <style jsx>{`
        .logo-frame {
          width: 80px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .brand-logo {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display: block;
        }
      `}</style>
    </header>
  );
}
