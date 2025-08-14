'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Plus, Menu, User, LogOut, Settings, List } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

function Avatar({
  name,
  photoUrl,
  size = 32,
}: {
  name?: string | null;
  photoUrl?: string | null;
  size?: number;
}) {
  const initials =
    (name || '')
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('') || 'U';

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name || 'Użytkownik'}
        className="rounded-full object-cover ring-1 ring-black/5"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="grid place-items-center rounded-full bg-gray-200 text-gray-700 font-semibold ring-1 ring-black/5"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* LEFT: logo + nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-gray-900">
            <span className="text-brand-600">houser</span>.pl
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <NavLink href="/ogloszenia" label="Ogłoszenia" />
            <NavLink href="/kategorie" label="Kategorie" />
            <NavLink href="/nowe-oferty" label="Nowe oferty" />
            <NavLink href="/blog" label="Blog" />
            {user && <NavLink href="/moje-ogloszenia" label="Moje ogłoszenia" />}
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

          {/* User avatar / login */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="group inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-2 py-1.5 pr-2.5 transition hover:bg-gray-50"
              >
                <Avatar name={user?.name} photoUrl={(user as any)?.avatar} size={28} />
                <span className="hidden text-sm text-gray-800 sm:inline">{user?.name || 'Konto'}</span>
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
                    <div className="px-3 py-2 text-xs text-gray-500">Twoje konto</div>
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
                    <button
                      className="dropdown-item inline-flex items-center gap-2 text-gray-800"
                      onClick={() => {
                        setOpen(false);
                        router.push('/moje-ogloszenia');
                      }}
                    >
                      <List className="h-4 w-4" /> Moje ogłoszenia
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

          {/* Mobile menu placeholder (opcjonalnie) */}
          <button className="md:hidden rounded-xl border border-gray-200 p-2 hover:bg-gray-50">
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </div>
    </header>
  );
}
