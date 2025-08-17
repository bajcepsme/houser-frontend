// src/app/hadmin/layout.tsx
import * as React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[var(--brand-page-bg,#f8fafc)] text-[var(--brand-text,#111827)]">
      {children}
    </div>
  );
}
