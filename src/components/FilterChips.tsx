'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

export default function FilterChips() {
  const sp = useSearchParams();
  const router = useRouter();

  const chips: { key: string; label: string; value: string }[] = [];
  const pushChip = (key: string, label: string) => {
    const val = sp.get(key);
    if (val) chips.push({ key, label, value: val });
  };

  pushChip('city', 'Miasto');
  pushChip('type', 'Typ');
  if (sp.get('min')) chips.push({ key: 'min', label: 'Cena min (PLN)', value: sp.get('min') as string });
  if (sp.get('max')) chips.push({ key: 'max', label: 'Cena max (PLN)', value: sp.get('max') as string });

  const remove = (key: string) => {
    const params = new URLSearchParams(sp.toString());
    params.delete(key);
    params.delete('page'); // reset paginacji po zmianie filtrów
    router.push(`/ogloszenia?${params.toString()}`);
  };

  const clearAll = () => router.push('/ogloszenia');

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={() => remove(c.key)}
          className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200"
          title="Usuń filtr"
        >
          <span className="font-medium">{c.label}:</span> <span>{c.value}</span>
          <X className="w-4 h-4 opacity-60" />
        </button>
      ))}
      <button onClick={clearAll} className="ml-1 text-sm text-brand-600 hover:text-brand-700">
        Wyczyść wszystko
      </button>
    </div>
  );
}
