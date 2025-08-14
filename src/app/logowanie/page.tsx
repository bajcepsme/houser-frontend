'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { popNext } from '@/utils/nextAfterLogin';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);

    try {
      const ok = await login(email, password);
      if (!ok) {
        setErr('Błędny email lub hasło.');
        return;
      }

      // 1) priorytet: parametr ?next=
      const nextFromQuery = searchParams.get('next');
      // 2) fallback: to, co zapamiętaliśmy w sessionStorage
      const nextFromSession = popNext();

      // Sanitizacja – tylko ścieżki wewnętrzne
      const sanitize = (v?: string | null) =>
        v && v.startsWith('/') ? decodeURIComponent(v) : null;

      const target =
        sanitize(nextFromQuery) ?? sanitize(nextFromSession) ?? '/moje-konto';

      router.replace(target);
    } catch (e: any) {
      setErr('Coś poszło nie tak. Spróbuj ponownie.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Logowanie</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="form-input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">Hasło</label>
          <input
            id="password"
            type="password"
            className="form-input w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        <button
          type="submit"
          disabled={submitting || isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-md disabled:opacity-60"
        >
          {submitting ? 'Logowanie…' : 'Zaloguj'}
        </button>
      </form>
    </main>
  );
}