'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await login?.(email, password);
      router.push('/'); // sukces → na stronę główną
    } catch (err: any) {
      setError(err?.message || 'Nie udało się zalogować.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm"
      >
        <h1 className="mb-4 text-xl font-bold">Logowanie</h1>
        {!!error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <label className="mb-3 block">
          <div className="mb-1 text-sm text-gray-600">E-mail</div>
          <input
            type="email"
            required
            className="input-modern w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>

        <label className="mb-4 block">
          <div className="mb-1 text-sm text-gray-600">Hasło</div>
          <input
            type="password"
            required
            className="input-modern w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className={[
            'w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition',
            loading ? 'bg-brand-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 shadow-soft hover:shadow-hover',
          ].join(' ')}
        >
          {loading ? 'Logowanie…' : 'Zaloguj'}
        </button>
      </form>
    </main>
  );
}
