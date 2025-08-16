'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const TYPES = [
  { id: 'person',    label: 'Osoba prywatna',  desc: 'Publikuj prywatne ogłoszenia.' },
  { id: 'agency',    label: 'Agencja nieruchomości', desc: 'Zespół agentów, wiele ofert.' },
  { id: 'developer', label: 'Deweloper', desc: 'Sprzedaż inwestycji i mieszkań.' },
  { id: 'office',    label: 'Urząd miasta/gminy', desc: 'Lokale komunalne, przetargi.' },
  { id: 'trustee',   label: 'Syndyk', desc: 'Oferty z mas upadłościowych.' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();

  function pick(type: string) {
    if (type === 'person') {
      // nic nie tworzymy – gotowe
      alert('Ustawiono typ konta: osoba prywatna. Możesz dodawać ogłoszenia.');
      router.replace('/moje-konto');
      return;
    }
    // dla typów organizacyjnych
    router.push(`/onboarding/organization?type=${type}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Wybierz typ konta</h1>
      <p className="text-sm text-gray-600">
        Dzięki temu dopasujemy panel i uprawnienia do Twoich potrzeb.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => pick(t.id)}
            className="rounded-xl border p-4 text-left hover:shadow-sm"
          >
            <div className="font-medium">{t.label}</div>
            <div className="text-xs text-gray-500 mt-1">{t.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
