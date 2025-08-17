// src/app/hadmin/ustawienia/page.tsx
'use client';

import AdminGuard from '@/components/admin/AdminGuard';

export default function AdminSettingsPage() {
  return (
    <AdminGuard>
      <main className="container-page py-6">
        <h1 className="text-2xl font-bold mb-3">Ustawienia</h1>
        <p className="text-gray-600">Tu dodamy globalne ustawienia (np. cache, tryb maintenance, itp.).</p>
      </main>
    </AdminGuard>
  );
}
