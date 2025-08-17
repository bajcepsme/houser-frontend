import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import BrandBootstrap from '@/components/BrandBootstrap';
import AppProviders from '@/components/AppProviders';

export const metadata: Metadata = {
  title: 'Houser.pl',
  description: 'Nowoczesny serwis nieruchomości',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-[var(--brand-page-bg,#f8fafc)] text-[var(--brand-text,#111827)]">
        <AppProviders>
          <BrandBootstrap />
          <Header />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
