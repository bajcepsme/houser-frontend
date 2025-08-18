'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useReducedMotion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Menu, X, Plus, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toAbsoluteUrl } from '@/lib/url';
import { loadBrandFromLocalStorage } from '@/lib/brand';

/* =========================================================
   U T I L S  &  H E L P E R S
========================================================= */

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(' ');
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

function useScrolled(threshold = 10) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = typeof window !== 'undefined' ? window.scrollY || 0 : 0;
        setScrolled(y > threshold);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [threshold]);
  return scrolled;
}

/* =========================================================
   S U B - C O M P O N E N T S
========================================================= */

// Avatar z cache-busterem + lazy
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
  const [src, setSrc] = React.useState<string>(() => resolveAvatarSrc(photoUrl));
  React.useEffect(() => setSrc(resolveAvatarSrc(photoUrl)), [photoUrl]);

  const isDataOrBlob = /^(data:|blob:)/i.test(src);
  const needsBuster = !isDataOrBlob && (/^https?:\/\//i.test(src) || src.startsWith('/'));
  const finalSrc =
    needsBuster && cacheKey != null
      ? `${src}${src.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(cacheKey))}`
      : src;

  const isDefault = src.startsWith('data:');
  return (
    <img
      key={finalSrc}
      src={finalSrc}
      alt={name || 'Użytkownik'}
      loading="lazy"
      decoding="async"
      className={clsx('rounded-full object-cover ring-1 ring-black/5', isDefault ? '' : 'bg-white')}
      style={{ width: size, height: size }}
      onError={() => setSrc(DEFAULT_AVATAR_DARK)}
    />
  );
}

// Brand logo + fallback + skeleton
function Brand() {
  const [brand, setBrand] = React.useState<{ title?: string | null; logo_url?: string | null; updated_at?: any } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = () => {
      const b = loadBrandFromLocalStorage() as any;
      setBrand(b || null);
      setLoading(false);
    };
    load();
    const onBrandUpdated = () => requestAnimationFrame(load);
    window.addEventListener('houser:brand:updated', onBrandUpdated);
    return () => window.removeEventListener('houser:brand:updated', onBrandUpdated);
  }, []);

  const src = resolveAssetSrc(brand?.logo_url);
  const bust =
    src && !/^(data:|blob:)/i.test(src)
      ? `${src}${src.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(brand?.updated_at ?? brand?.logo_url ?? '1'))}`
      : src;

  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Strona główna">
      {loading ? (
        <span className="h-8 w-20 rounded-md bg-black/10 animate-pulse" aria-hidden />
      ) : bust ? (
        <div className="h-10 w-20 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bust} alt={brand?.title || 'Houser'} className="max-h-10 max-w-20 object-contain" />
        </div>
      ) : (
        <span className="text-xl font-extrabold tracking-tight text-gray-900">
          <span className="text-brand-600">{(brand?.title || 'houser').toLowerCase()}</span>.pl
        </span>
      )}
    </Link>
  );
}

// Animowany NavLink z „ink bar”
function NavLink({ href, label }: { href: string; label: string }) {
  const path = usePathname();
  const active = path === href || (href !== '/' && path.startsWith(href));
  return (
    <Link
      href={href}
      className={clsx(
        'relative inline-flex items-center rounded-full px-3.5 py-2 text-sm transition',
        active ? 'text-gray-900' : 'text-gray-700 hover:bg-black/[.03] hover:shadow-sm'
      )}
    >
      {label}
      <AnimatePresence>
        {active && (
          <motion.span
            layoutId="nav-inkbar"
            className="absolute left-2 right-2 -bottom-1 h-[2px] rounded-full bg-gray-900"
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          />
        )}
      </AnimatePresence>
    </Link>
  );
}

// CTA z efektem „shine”
function CtaAdd() {
  return (
    <Link
      href="/dodaj-ogloszenie"
      aria-label="Dodaj ogłoszenie"
      className="group relative inline-flex items-center justify-center rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm outline-none transition active:scale-[.98] hover:bg-brand-700 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <Plus className="mr-2 h-4 w-4" />
      Dodaj ogłoszenie
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <span className="shine" />
      </span>
    </Link>
  );
}

// Dropdown użytkownika (focus mgmt, ESC, klik poza)
function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const firstItemRef = React.useRef<HTMLButtonElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    // focus pierwszy item
    setTimeout(() => firstItemRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/logowanie"
        className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800 transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <User className="mr-2 h-4 w-4" />
        Zaloguj się
      </Link>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="group inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-2 py-1.5 pr-2.5 transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <Avatar
          name={user?.name}
          photoUrl={(user as any)?.avatar}
          size={28}
          cacheKey={(user as any)?.updated_at || (user as any)?.avatar}
        />
        <span className="hidden text-sm text-gray-800 sm:inline">{user?.name || 'Konto'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, scale: 0.96, y: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            role="menu"
            aria-label="menu użytkownika"
            className="absolute right-0 z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-2xl bg-white/90 shadow-lg ring-1 ring-black/5 backdrop-blur before:absolute before:-top-2 before:right-6 before:h-3 before:w-3 before:rotate-45 before:rounded-[2px] before:bg-white/90 before:shadow-[0_-1px_1px_rgba(0,0,0,0.04)]"
          >
            <div className="px-3 py-2 text-xs text-gray-500">Twoje konto</div>
            <div className="py-1">
              <button
                ref={firstItemRef}
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-800 hover:bg-black/[.03] focus-visible:bg-black/[.03] focus-visible:outline-none"
                onClick={() => {
                  setOpen(false);
                  router.push('/moje-konto');
                }}
              >
                <User className="h-4 w-4" />
                Moje konto
              </button>
              <button
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-800 hover:bg-black/[.03] focus-visible:bg-black/[.03] focus-visible:outline-none"
                onClick={() => {
                  setOpen(false);
                  router.push('/ustawienia');
                }}
              >
                <Settings className="h-4 w-4" />
                Ustawienia
              </button>
              <div className="my-1 h-px bg-gray-100" />
              <button
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none"
                onClick={async () => {
                  setOpen(false);
                  await logout?.();
                  router.push('/');
                }}
              >
                <LogOut className="h-4 w-4" />
                Wyloguj
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Drawer mobilny (dialog + trap focus)
function MobileDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  // ESC + klik poza + prosty focus trap
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const node = panelRef.current;
        if (!node) return;
        const focusable = node.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    const onClick = (e: MouseEvent) => {
      const node = panelRef.current;
      if (node && !node.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
          />
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            ref={panelRef}
            tabIndex={-1}
            className="fixed inset-y-0 right-0 z-50 w-[88%] max-w-sm bg-white/90 backdrop-blur-xl ring-1 ring-black/5 shadow-xl p-4 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   M A I N   H E A D E R
========================================================= */

export default function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const scrolled = useScrolled(12);

  const headerVariants = {
    initial: { backgroundColor: 'rgba(255,255,255,0.8)', height: 72, boxShadow: '0 0 0 rgba(0,0,0,0)' },
    scrolled: { backgroundColor: 'rgba(255,255,255,1)', height: 60, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' },
  } as const;

  const [bgAlpha, setBgAlpha] = React.useState(0.25);
React.useEffect(() => {
  if (typeof window === 'undefined') return;
  const onScroll = () => {
    const y = window.scrollY || 0;
    const a = Math.min(1, 0.25 + y / 120); // 0.25 -> 1.0 w okolicach 120px
    setBgAlpha(a);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);

  return (
    <>
     <motion.header
  variants={headerVariants}
  animate={scrolled ? 'scrolled' : 'initial'}
  transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 250, damping: 30 }}
  className="fixed inset-x-0 top-0 z-[99999] ring-1 ring-black/5"
  style={{
    backgroundColor: `rgba(255,255,255,${bgAlpha})`, // 25% u góry hero → 100% poniżej
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    isolation: 'isolate', // własny stacking context
    pointerEvents: 'auto',
  }}
>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" style={{ height: '100%' }}>
          {/* Brand + nav */}
          <div className="flex items-center gap-4 md:gap-6">
            <Brand />

            <LayoutGroup id="main-nav">
              <nav className="hidden md:flex items-center gap-1.5">
                <NavLink href="/ogloszenia" label="Ogłoszenia" />
                <NavLink href="/kategorie" label="Kategorie" />
                <NavLink href="/nowe-oferty" label="Nowe oferty" />
                <NavLink href="/blog" label="Blog" />
                {user && <NavLink href="/moje-ogloszenia" label="Moje ogłoszenia" />}
              </nav>
            </LayoutGroup>
          </div>

          {/* CTA + user + hamburger */}
          <div className="flex items-center gap-2">
            <CtaAdd />
            <UserMenu />

            <button
              type="button"
              aria-label="Otwórz menu"
              className="ml-1 inline-flex md:hidden items-center justify-center rounded-xl border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-500"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Drawer mobilny */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Menu</span>
          <button
            aria-label="Zamknij menu"
            className="rounded-lg p-2 text-gray-600 hover:bg-black/[.04] focus-visible:ring-2 focus-visible:ring-brand-500"
            onClick={() => setDrawerOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Miejsce pod przyszłą wyszukiwarkę */}
        <div className="mt-4">
          <div className="h-10 w-full rounded-xl border border-gray-200 bg-white/80 ring-1 ring-white/50" aria-hidden />
        </div>

        <div className="mt-6 grid gap-1.5">
          <Link
            href="/ogloszenia"
            onClick={() => setDrawerOpen(false)}
            className={clsx(
              'rounded-xl px-3 py-2 text-gray-800 hover:bg-black/[.03]',
              pathname.startsWith('/ogloszenia') && 'bg-black/[.04] font-medium'
            )}
          >
            Ogłoszenia
          </Link>
          <Link href="/kategorie" onClick={() => setDrawerOpen(false)} className="rounded-xl px-3 py-2 text-gray-800 hover:bg-black/[.03]">
            Kategorie
          </Link>
          <Link href="/nowe-oferty" onClick={() => setDrawerOpen(false)} className="rounded-xl px-3 py-2 text-gray-800 hover:bg-black/[.03]">
            Nowe oferty
          </Link>
          <Link href="/blog" onClick={() => setDrawerOpen(false)} className="rounded-xl px-3 py-2 text-gray-800 hover:bg-black/[.03]">
            Blog
          </Link>
          {/* CTA w drawerze */}
          <div className="pt-2">
            <CtaAdd />
          </div>
        </div>
      </MobileDrawer>

      {/* Style dla efektu shine na CTA */}
      <style jsx>{`
        .shine {
          position: absolute;
          inset: -200%;
          background: linear-gradient(
            115deg,
            transparent 0%,
            rgba(255, 255, 255, 0.55) 50%,
            transparent 100%
          );
          transform: translateX(-60%);
          transition: transform 600ms ease;
          will-change: transform;
          pointer-events: none;
          mix-blend-mode: screen;
        }
        :global(.group:hover .shine) {
          transform: translateX(60%);
        }
        @media (prefers-reduced-motion: reduce) {
          .shine {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
