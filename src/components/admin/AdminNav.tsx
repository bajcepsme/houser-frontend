// src/components/admin/AdminNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AdminNav() {
  const pathname = usePathname();
  const items = [
    { href: '/admin/users', label: 'Użytkownicy' },
    { href: '/admin/organizations', label: 'Organizacje' }, // ⬅️ nowa zakładka
    { href: '/admin/branding', label: 'Branding' },
  ];
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4">
        <ul className="flex gap-4">
          {items.map((it) => {
            const active = pathname?.startsWith(it.href);
            return (
              <li key={it.href}>
                <Link
                  className={cn(
                    'inline-block py-3 border-b-2',
                    active ? 'border-black font-medium' : 'border-transparent text-gray-600 hover:text-black'
                  )}
                  href={it.href}
                >
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
