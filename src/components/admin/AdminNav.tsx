'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, Building2, Settings } from 'lucide-react';

export default function AdminNav({ top = 64 }: { top?: number }) {
  const path = usePathname();

  const items = [
    { href: '/hadmin', icon: LayoutGrid, label: 'Dashboard' },
    { href: '/hadmin/users', icon: Users, label: 'Użytkownicy' },
    { href: '/hadmin/organizations', icon: Building2, label: 'Organizacje' },
    { href: '/hadmin/branding', icon: Settings, label: 'Branding' },
  ];

  return (
    <aside
      className="fixed left-0 z-50 flex w-[72px] flex-col items-center border-r border-black/10"
      style={{
        top,
        bottom: 0,
        background:
          'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
      }}
    >
      <div className="mt-3 mb-2 text-[10px] uppercase tracking-widest text-white/60">admin</div>
      <nav className="flex flex-col items-center gap-2">
        {items.map(({ href, icon: Icon, label }) => {
          const active = path === href || (href !== '/hadmin' && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="group relative grid h-11 w-11 place-items-center rounded-xl transition"
              title={label}
              style={{
                background: active ? 'rgba(255,255,255,.08)' : 'transparent',
                boxShadow: active ? 'inset 0 0 0 1px rgba(255,255,255,.25)' : 'none',
              }}
            >
              <Icon
                className="h-5 w-5 transition"
                style={{ color: active ? '#fff' : 'rgba(255,255,255,.6)' }}
              />
              {/* tooltip */}
              <span className="pointer-events-none absolute left-[60px] z-10 hidden select-none rounded-lg bg-black/80 px-2 py-1 text-xs text-white shadow-xl backdrop-blur-md group-hover:block">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
