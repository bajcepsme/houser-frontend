'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import {
  LayoutDashboard,
  PanelsTopLeft,
  ImagePlus,
  Users,
  Settings,
  Brush,
  ChevronLeft,
  Pin,
  PinOff,
} from 'lucide-react';

const COLLAPSED = 72;
const EXPANDED = 260;
const LS_PIN = 'houser.admin.sidebar.pin';

function NavItem({
  href,
  icon: Icon,
  label,
  expanded,
}: {
  href: string;
  icon: any;
  label: string;
  expanded: boolean;
}) {
  const path = usePathname();
  const active = path === href || path.startsWith(href + '/');
  return (
    <Link
      href={href}
      title={!expanded ? label : undefined}
      className={[
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition',
        active ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-100',
      ].join(' ')}
    >
      <Icon className={['h-5 w-5', active ? 'text-brand-700' : 'text-gray-500 group-hover:text-gray-700'].join(' ')} />
      <span className={expanded ? 'whitespace-nowrap' : 'hidden'}>{label}</span>
    </Link>
  );
}

export default function AdminSidebar({
  onHoverChange,
  expandedExternal,
}: {
  onHoverChange?: (hovered: boolean) => void;
  expandedExternal?: boolean;
}) {
  const [pinned, setPinned] = React.useState<boolean>(false);
  const [hovered, setHovered] = React.useState<boolean>(false);

  React.useEffect(() => {
    try {
      setPinned(localStorage.getItem(LS_PIN) === '1');
    } catch {}
  }, []);

  const expanded = expandedExternal ?? pinned || hovered;
  const width = expanded ? EXPANDED : COLLAPSED;

  const setPin = (v: boolean) => {
    setPinned(v);
    try {
      localStorage.setItem(LS_PIN, v ? '1' : '0');
    } catch {}
  };

  return (
    <aside
      onMouseEnter={() => {
        setHovered(true);
        onHoverChange?.(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
        onHoverChange?.(false);
      }}
      className="fixed left-0 top-0 z-[60] h-screen border-r border-gray-200 bg-white/95 shadow-lg backdrop-blur"
      style={{ width, transition: 'width 200ms ease' }}
    >
      {/* header */}
      <div className="flex h-16 items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gray-900" />
          <span className={expanded ? 'text-sm font-semibold text-gray-900' : 'hidden'}>Panel admina</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            title={pinned ? 'Odepnij' : 'Przypnij'}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            onClick={() => setPin(!pinned)}
          >
            {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </button>
          <button
            title="Zwiń"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            onClick={() => setPin(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* nawigacja */}
      <div className="px-2">
        <NavItem href="/hadmin" icon={LayoutDashboard} label="Pulpit" expanded={expanded} />
        <NavItem href="/hadmin/ogloszenia" icon={PanelsTopLeft} label="Ogłoszenia" expanded={expanded} />
        <NavItem href="/hadmin/zdjecia" icon={ImagePlus} label="Biblioteka zdjęć" expanded={expanded} />
        <div className="mt-2 mb-2 h-px bg-gray-200" />
        <NavItem href="/hadmin/branding" icon={Brush} label="Branding" expanded={expanded} />
        <NavItem href="/hadmin/users" icon={Users} label="Użytkownicy" expanded={expanded} />
        <NavItem href="/hadmin/ustawienia" icon={Settings} label="Ustawienia" expanded={expanded} />
      </div>
    </aside>
  );
}
