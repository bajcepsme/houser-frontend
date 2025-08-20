// src/lib/favorites.ts
const KEY = 'houser:favs';
export const FAVS_EVENT = 'houser:favs:changed';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://127.0.0.1:8000')
  .replace(/\/+$/, '');

function emit() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(FAVS_EVENT));
}

/* ===== localStorage ===== */
function read(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as (string | number)[]) : [];
    return Array.from(new Set(arr.map(String)));
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(Array.from(new Set(ids))));
    emit();
  } catch {}
}

export function loadFavoriteIds(): string[] { return read(); }
export function isFavorite(id: string | number): boolean { return read().includes(String(id)); }
export function addFavoriteLocal(id: string | number) {
  const ids = read(); const s = String(id);
  if (!ids.includes(s)) { ids.push(s); write(ids); }
}
export function removeFavoriteLocal(id: string | number) {
  write(read().filter((x) => x !== String(id)));
}
export function subscribeFavorites(cb: () => void): () => void {
  const on = () => cb();
  window.addEventListener(FAVS_EVENT, on as EventListener);
  window.addEventListener('storage', on as EventListener);
  return () => {
    window.removeEventListener(FAVS_EVENT, on as EventListener);
    window.removeEventListener('storage', on as EventListener);
  };
}

/* ===== auth helper ===== */
function authHeaders(): Record<string, string> {
  try {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch {
    return {};
  }
}

/* ====== backend sync (Bearer preferowany, cookies fallback) ====== */
async function trySyncAdd(id: string | number) {
  const listingId = String(id);
  const headers: Record<string, string> = { Accept: 'application/json', ...authHeaders() };
  const hasToken = !!headers.Authorization;

  try {
    // styl REST: POST /favorites/:id
    const res = await fetch(`${API_BASE}/api/v1/favorites/${encodeURIComponent(listingId)}`, {
      method: 'POST',
      headers,
      ...(hasToken ? {} : { credentials: 'include' }),
    });
    if (res.ok) return;
  } catch {}

  try {
    // styl RPC: POST /favorites { id, action: 'add' }
    const res2 = await fetch(`${API_BASE}/api/v1/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
      body: JSON.stringify({ id: listingId, action: 'add' }),
      ...(hasToken ? {} : { credentials: 'include' }),
    });
    if (res2.ok) return;
  } catch {}
}

async function trySyncRemove(id: string | number) {
  const listingId = String(id);
  const headers: Record<string, string> = { Accept: 'application/json', ...authHeaders() };
  const hasToken = !!headers.Authorization;

  try {
    const res = await fetch(`${API_BASE}/api/v1/favorites/${encodeURIComponent(listingId)}`, {
      method: 'DELETE',
      headers,
      ...(hasToken ? {} : { credentials: 'include' }),
    });
    if (res.ok) return;
  } catch {}

  try {
    const res2 = await fetch(`${API_BASE}/api/v1/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
      body: JSON.stringify({ id: listingId, action: 'remove' }),
      ...(hasToken ? {} : { credentials: 'include' }),
    });
    if (res2.ok) return;
  } catch {}
}

/** Toggle z optymistyczną aktualizacją. Zwraca nowy stan (true = dodane). */
export async function toggleFavorite(id: string | number): Promise<boolean> {
  const s = String(id);
  if (isFavorite(s)) {
    removeFavoriteLocal(s);
    trySyncRemove(s);
    return false;
  } else {
    addFavoriteLocal(s);
    trySyncAdd(s);
    return true;
  }
}
