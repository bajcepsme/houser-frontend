// Uwaga: bez 'use client'!
import ClientWrapper from './ClientWrapper';

export default function Page({ params }: { params: { id: string } }) {
  return <ClientWrapper id={params.id} />;
}
