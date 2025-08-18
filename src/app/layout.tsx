import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import BrandBootstrap from '@/components/BrandBootstrap';
import AppProviders from '@/components/AppProviders';
import BrandMetadataClient from '@/components/BrandMetadataClient';

export const metadata: Metadata = {
  title: 'Houser.pl',
  description: 'Nowoczesny serwis nieruchomości',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <AppProviders>
          <BrandBootstrap />
          <BrandMetadataClient /> {/* zawsze client */}
          <Header />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
