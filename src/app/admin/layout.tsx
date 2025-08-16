// src/app/admin/layout.tsx
import type { Metadata } from 'next';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminNav from '@/components/admin/AdminNav';

export const metadata: Metadata = {
  title: 'Panel administracyjny — Houser',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminNav />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </AdminGuard>
  );
}
