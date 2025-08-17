// src/lib/adminApi.ts
export const API_BASE = ((process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')) + '/api';

if (!process.env.NEXT_PUBLIC_API_URL) {
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
    init.body = opts.formData; // nie ustawiamy Content-Type
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
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

/* ---------- API ---------- */
export const adminApi = {
  // Users
  getUsers: () => adminFetch('/v1/admin/users'),
  updateUser: (id: number, payload: any) =>
    adminFetch(`/v1/admin/users/${id}`, { method: 'PATCH', json: payload }),

  // Organizations
  getOrganizations: () => adminFetch('/v1/admin/organizations'),
  getOrganization: (id: number) => adminFetch(`/v1/admin/organizations/${id}`), // ⬅ DODANE
  updateOrganization: (id: number, payload: any) =>
    adminFetch(`/v1/admin/organizations/${id}`, { method: 'PATCH', json: payload }),

  // Branding / settings (superadmin)
  getBrand: () => adminFetch('/v1/admin/settings/brand'),
  saveBrand: (payload: any) =>
    adminFetch('/v1/admin/settings/brand', { method: 'POST', json: payload }),
  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append('logo', file);
    return adminFetch('/v1/admin/settings/logo', { method: 'POST', formData: fd });
  },
};
