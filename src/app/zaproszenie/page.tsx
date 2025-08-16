'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminFetch } from '@/lib/adminApi';

export default function InvitationAcceptPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const [msg, setMsg] = useState<string>('Przetwarzanie…');

  useEffect(() => {
    const t = sp.get('token');
    if (!t) { setMsg('Brak tokenu zaproszenia.'); return; }
    if (!token) { 
      setMsg('Zaloguj się, aby przyjąć zaproszenie…');
      // jeśli masz swoją stronę logowania, przekieruj i wróć tu z powrotem
      // router.push(`/logowanie?next=/zaproszenie?token=${encodeURIComponent(t)}`);
      return;
    }
    (async () => {
      try {
        await adminFetch('/api/v1/organizations/invitations/accept', {
          method: 'POST', token, json: { token: t }
        });
        setMsg('Zaproszenie przyjęte. Przenoszę do „Moje konto”…');
        setTimeout(() => router.replace('/moje-konto'), 1200);
      } catch (e:any) {
        setMsg(e?.message || 'Nie udało się przyjąć zaproszenia.');
      }
    })();
  }, [sp, token, router]);

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold mb-4">Akceptacja zaproszenia</h1>
      <p className="text-sm text-gray-700">{msg}</p>
      {!token && (
        <p className="mt-4 text-sm text-gray-500">
          Jesteś niezalogowany. Zaloguj się, a następnie wróć na ten adres.
        </p>
      )}
    </div>
  );
}
