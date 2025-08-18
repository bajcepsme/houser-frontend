'use client';

import { useEffect } from 'react';
import { loadBrandFromLocalStorage, BRAND_EVENT, DEFAULT_BRAND } from '@/lib/brand';

export default function BrandMetadataUpdater() {
  useEffect(() => {
    const updateHead = () => {
      const brand = loadBrandFromLocalStorage() || DEFAULT_BRAND;

      // <title>
      const title = brand?.title || DEFAULT_BRAND.title;
      if (title) document.title = title;

      // <meta name="description">
      const description = brand?.meta_description || DEFAULT_BRAND.meta_description || '';
      if (description) {
        let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', description);
      }

      // <link rel="icon">
      const faviconUrl = brand?.favicon_url;
      if (faviconUrl && typeof faviconUrl === 'string') {
        let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = faviconUrl;
      }
    };

    updateHead();

    const onBrand = () => updateHead();
    const onStorage = (e: StorageEvent) => { if (e.key === 'houser.brand') updateHead(); };

    window.addEventListener(BRAND_EVENT, onBrand as EventListener);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener(BRAND_EVENT, onBrand as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return null;
}
