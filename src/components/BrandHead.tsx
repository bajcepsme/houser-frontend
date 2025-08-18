'use client';

import { useEffect, useState } from 'react';
import { BRAND_EVENT, DEFAULT_BRAND, loadBrandFromLocalStorage } from '@/lib/brand';

export default function BrandHeading({
  fallbackTitle = DEFAULT_BRAND.title!,
  fallbackTagline = DEFAULT_BRAND.tagline || '',
  className = '',
}: {
  fallbackTitle?: string;
  fallbackTagline?: string;
  className?: string;
}) {
  const [title, setTitle] = useState(fallbackTitle);
  const [tagline, setTagline] = useState(fallbackTagline);

  useEffect(() => {
    const apply = () => {
      const b = loadBrandFromLocalStorage();
      setTitle(b?.title || fallbackTitle);
      setTagline(b?.tagline || fallbackTagline);
    };
    apply();
    const onCustom = () => apply();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'houser.brand') apply();
    };
    window.addEventListener(BRAND_EVENT, onCustom as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(BRAND_EVENT, onCustom as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [fallbackTitle, fallbackTagline]);

  return (
    <header className={className}>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">{title}</h1>
      {tagline && <p className="mt-1 text-gray-500">{tagline}</p>}
    </header>
  );
}
