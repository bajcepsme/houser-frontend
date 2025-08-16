// src/lib/adminApi.ts
export const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

if (!API_BASE) {
  // Nie przerywamy działania, ale logujemy. Podaj NEXT_PUBLIC_API_URL w .env.local
  console.warn('NEXT_PUBLIC_API_URL is not set.');
}

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  token?: string | null;
  json?: any;
  formData?: FormData;
  headers?: Record<string, string>;
};

export async function adminFetch<T = any>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const token = opts.token ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers || {}),
  };
  const init: RequestInit = { method: opts.method || 'GET', headers };

  if (token) headers.Authorization = `Bearer ${token}`;

  if (opts.formData) {
    init.body = opts.formData;
    // UWAGA: NIE ustawiamy Content-Type przy FormData (browser sam nada boundary)
  } else if (opts.json) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(opts.json);
  }

  const res = await fetch(url, init);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j?.message) msg += `: ${j.message}`;
    } catch (_) {}
    throw new Error(msg);
  }
  // może być 204
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}
