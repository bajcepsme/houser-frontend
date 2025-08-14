'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type PlanKey = 'free' | 'pro' | 'premium';

export default function PricingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { token } = useAuth();

  // Id szkicu (utworzonego wcześniej w kroku 2)
  const draftId = params.get('id') || params.get('listingId') || params.get('draftId');

  const [submitting, setSubmitting] = React.useState<PlanKey | null>(null);
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (!draftId) {
      setToast({ type: 'error', text: 'Brakuje ID ogłoszenia (draft). Wróć i spróbuj ponownie.' });
    }
  }, [draftId]);

  function showToast(type: 'success' | 'error', text: string) {
    setToast({ type: type, text });
    // autohide
    setTimeout(() => setToast(null), 4200);
  }

  async function handleChoose(plan: PlanKey) {
    if (!draftId || !token) {
      showToast('error', 'Brak autoryzacji lub ID ogłoszenia.');
      return;
    }
    setSubmitting(plan);

    try {
      const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
      // >>> Poprawny endpoint publikacji z Twoich routes: POST /api/v1/listings/{listing}/activate
      const res = await fetch(`${base}/api/v1/listings/${draftId}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }), // backend może zignorować, ale nie szkodzi
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `HTTP ${res.status}`);
      }

      showToast('success', 'Ogłoszenie opublikowane! Przekierowuję…');
      // Po krótkiej pauzie przenieś na stronę szczegółów
      setTimeout(() => router.replace(`/ogloszenia/${draftId}`), 800);
    } catch (e: any) {
      showToast(
        'error',
        `Nie udało się opublikować ogłoszenia. ${e?.message ? `Szczegóły: ${e.message}` : ''}`
      );
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <main className="container-page py-8">
      {/* Floating toast */}
      <ToastBanner toast={toast} onClose={() => setToast(null)} />

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Wybierz pakiet publikacji</h1>
        <p className="text-gray-600 mt-1">
          Zdecyduj, jak chcesz zaprezentować swoje ogłoszenie. Pakiet możesz zmienić później.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free */}
        <PlanCard
          title="Darmowy"
          price="0 zł"
          period=""
          features={[
            'Widoczność w wynikach',
            '12 zdjęć w galerii',
            'Podstawowa prezentacja',
          ]}
          cta="Opublikuj za darmo"
          highlight={false}
          disabled={false}
          loading={submitting === 'free'}
          onClick={() => handleChoose('free')}
        />

        {/* Pro */}
        <PlanCard
          title="Pro"
          price="39 zł"
          period="/ 30 dni"
          features={[
            'Priorytet w wynikach',
            '30 zdjęć + 1 wideo',
            'Wyróżnienie kolorem',
            'Sekcja „Polecane”',
          ]}
          cta="Wybierz Pro"
          highlight
          disabled={false}
          loading={submitting === 'pro'}
          onClick={() => handleChoose('pro')}
        />

        {/* Premium */}
        <PlanCard
          title="Premium"
          price="79 zł"
          period="/ 30 dni"
          features={[
            'Top oferty + Badge',
            'Natywna ekspozycja w listingach',
            'Galeria bez limitu',
            'Rozszerzone statystyki',
          ]}
          cta="Wybierz Premium"
          highlight={false}
          disabled={false}
          loading={submitting === 'premium'}
          onClick={() => handleChoose('premium')}
        />
      </section>

      {/* pomocniczy link wstecz */}
      <div className="mt-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost"
        >
          ‹ Wróć
        </button>
      </div>

      {/* lokalne style: podstawowe przyciski/utility jeśli nie masz globalnie */}
      <style jsx>{`
        .btn {
          @apply inline-flex items-center justify-center rounded-xl px-5 py-2.5 font-medium shadow-sm transition;
        }
        .btn-primary {
          @apply btn bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800;
        }
        .btn-ghost {
          @apply inline-flex items-center rounded-xl px-4 py-2 text-gray-700 hover:bg-gray-100;
        }
        .badge {
          @apply inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm;
        }
      `}</style>
    </main>
  );
}

/* —————————————————— WSPÓŁDZIELONE KOMPONENTY —————————————————— */

function PlanCard({
  title,
  price,
  period,
  features,
  cta,
  highlight,
  disabled,
  loading,
  onClick,
}: {
  title: string;
  price: string;
  period?: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={[
        'relative rounded-2xl border p-6 bg-white shadow-sm transition hover:shadow-md',
        highlight ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200',
      ].join(' ')}
    >
      {highlight && (
        <div className="absolute -top-3 right-4 badge bg-blue-600 text-white">Najczęściej wybierany</div>
      )}
      <h3 className="text-xl font-bold">{title}</h3>
      <div className="mt-3 flex items-end gap-2">
        <div className="text-4xl font-extrabold">{price}</div>
        {period ? <div className="pb-1 text-gray-500">{period}</div> : null}
      </div>
      <ul className="mt-5 space-y-2 text-sm text-gray-700">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={disabled || loading}
        onClick={onClick}
        className={[
          'mt-6 w-full rounded-xl px-5 py-3 font-semibold transition',
          disabled
            ? 'cursor-not-allowed bg-gray-200 text-gray-500'
            : highlight
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-900 text-white hover:bg-black',
        ].join(' ')}
      >
        {loading ? 'Przetwarzanie…' : cta}
      </button>
    </div>
  );
}

/** Pływający toast (góra strony) */
function ToastBanner({
  toast,
  onClose,
}: {
  toast: { type: 'success' | 'error'; text: string } | null;
  onClose: () => void;
}) {
  if (!toast) return null;
  const base =
    'fixed left-1/2 top-4 z-[1000] -translate-x-1/2 px-5 py-3 rounded-2xl shadow-2xl ring-1 backdrop-blur flex items-center gap-3';
  const tone =
    toast.type === 'success'
      ? 'bg-emerald-500 text-white ring-emerald-400/60'
      : 'bg-rose-500 text-white ring-rose-400/60';

  return (
    <div className={`${base} ${tone} animate-[slideDown_.35s_ease-out]`}>
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/50 opacity-75"></span>
        <span className="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
      </span>
      <span className="font-medium">{toast.text}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 rounded-lg px-2 py-1/2 text-xs/rel hover:bg-white/15"
      >
        Zamknij
      </button>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translate(-50%, -10px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
