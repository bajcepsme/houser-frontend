// BEZ new URL – 100% defensywnie
export function toAbsoluteUrl(u?: string | null, opts?: { placeholder?: string }) {
  const placeholder = opts?.placeholder ?? '';
  if (!u || typeof u !== 'string') return placeholder;

  // 1) jeśli już absolutny – zwróć
  if (/^https?:\/\//i.test(u)) return u;

  // 2) odetnij leading slashe, ale zachowaj ścieżkę
  const clean = u.replace(/^\/+/, '');

  // 3) baza z ENV (może być pusta – to OK)
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').toString().replace(/\/+$/, '');

  if (base) return `${base}/${clean}`;
  // brak bazy? zwróć względny (Next poradzi sobie)
  return `/${clean}`;
}
