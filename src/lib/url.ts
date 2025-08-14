export function toAbsoluteUrl(path?: string | null): string {
  if (!path) return '';

  // Jeśli ścieżka jest już pełnym URL-em — nic nie zmieniamy
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Upewniamy się, że mamy hosta API
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
  if (!base) return path;

  // Doklejamy ścieżkę, dbając o brak podwójnych ukośników
  return `${base}/${path.replace(/^\/+/, '')}`;
}
