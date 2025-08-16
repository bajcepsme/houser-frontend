// src/components/BrandLoader.tsx
'use client';

import { useEffect } from 'react';
import { applyBrandToHtml, loadBrandFromLocalStorage } from '@/lib/brand';

export default function BrandLoader() {
  useEffect(() => {
    const brand = loadBrandFromLocalStorage();
    if (brand) {
      applyBrandToHtml(brand);
    }
  }, []);
  return null;
}
