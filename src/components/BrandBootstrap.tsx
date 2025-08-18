'use client';

import { useEffect } from 'react';
import { applyBrandToHtml, loadBrandFromLocalStorage, BRAND_EVENT } from '@/lib/brand';

export default function BrandBootstrap() {
  useEffect(() => {
    const apply = () => applyBrandToHtml(loadBrandFromLocalStorage() || undefined);
    apply();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'houser.brand') apply();
    };
    const onCustom = () => apply();
    window.addEventListener('storage', onStorage);
    window.addEventListener(BRAND_EVENT, onCustom as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(BRAND_EVENT, onCustom as EventListener);
    };
  }, []);
  return null;
}
