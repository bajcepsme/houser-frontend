'use client';

import dynamic from 'next/dynamic';

// ładujemy ClientPage wyłącznie w przeglądarce
const ClientPage = dynamic(() => import('./ClientPage'), { ssr: false });

export default function ClientWrapper({ id }: { id: string }) {
  return <ClientPage id={id} />;
}
