// src/app/layout.tsx
import './globals.css';
import AppProviders from '@/components/AppProviders';
import BrandBootstrap from '@/components/BrandBootstrap';
import BrandMetadataClient from '@/components/BrandMetadataClient';
import Header from '@/components/Header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  // 👇 NIE ustawiamy title/description tutaj – steruje tym BrandMetadataClient
  icons: { icon: '/favicon.ico' },
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <AppProviders>
          <BrandBootstrap />
          <BrandMetadataClient />
          <Header />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
