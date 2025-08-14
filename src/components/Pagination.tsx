'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function Pagination({ meta }: { meta: any }) {
  const pathname = usePathname();
  const sp = useSearchParams();

  const current = Number(meta?.current_page ?? 1);
  const last = Number(meta?.last_page ?? 1);
  if (last <= 1) return null;

  const makeHref = (page: number) => {
    const params = new URLSearchParams(sp.toString());
    params.set('page', String(page));
    return `${pathname}?${params.toString()}`;
  };

  const pages: number[] = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(last, current + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="mt-6 flex items-center justify-center gap-2">
      <Link
        href={makeHref(Math.max(1, current - 1))}
        className={`px-3 py-2 rounded-lg border ${current === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
      >
        Poprzednia
      </Link>

      {start > 1 && (
        <>
          <Link href={makeHref(1)} className="px-3 py-2 rounded-lg border hover:bg-gray-50">1</Link>
          {start > 2 && <span className="px-2">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={makeHref(p)}
          className={`px-3 py-2 rounded-lg border ${p === current ? 'bg-brand-600 border-brand-600 text-white' : 'hover:bg-gray-50'}`}
        >
          {p}
        </Link>
      ))}

      {end < last && (
        <>
          {end < last - 1 && <span className="px-2">…</span>}
          <Link href={makeHref(last)} className="px-3 py-2 rounded-lg border hover:bg-gray-50">{last}</Link>
        </>
      )}

      <Link
        href={makeHref(Math.min(last, current + 1))}
        className={`px-3 py-2 rounded-lg border ${current === last ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
      >
        Następna
      </Link>
    </nav>
  );
}
