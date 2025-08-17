'use client';

import { useEffect } from 'react';
import { applyBrandToHtml, loadBrandFromLocalStorage } from '@/lib/brand';

export default function BrandInit() {
  useEffect(() => {
    const apply = () => applyBrandToHtml(loadBrandFromLocalStorage());

    // pierwsze nałożenie
    apply();

    // cross-tab (inna karta) + lokalny event po zapisie
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'houser.brand') apply();
    };
    const onCustom = () => apply();

    window.addEventListener('storage', onStorage);
    window.addEventListener('houser:brand:updated', onCustom as any);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('houser:brand:updated', onCustom as any);
    };
  }, []);

  return null;
}
