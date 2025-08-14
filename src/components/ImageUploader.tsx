'use client';

import * as React from 'react';

type ApiImage = { id?: number; url: string; order?: number; type?: 'photo' | 'floorplan' };

type LegacyProps = {
  label?: string;
  hint?: string;
  files: File[];
  setFiles: (files: File[]) => void;
  limit?: number;
  showPrimaryBadge?: boolean;
  onDelete?: (itemToDelete: File) => void;
};

type NewProps = {
  label?: string;
  hint?: string;
  images: (ApiImage | File)[];
  onChange: (arr: (ApiImage | File)[]) => void;
  limit?: number;
  type?: 'photo' | 'floorplan';
  showPrimaryBadge?: boolean;
  onDelete?: (itemToDelete: ApiImage | File) => void;
};

type Props = LegacyProps | NewProps;
const isLegacy = (p: Props): p is LegacyProps => (p as LegacyProps).setFiles !== undefined;

export default function ImageUploader(props: Props) {
  const { label, hint, limit, showPrimaryBadge = true } = props as any;

  // czytaj props wprost (bez useMemo — stabilniejsze przy DnD)
  const items: (ApiImage | File)[] = isLegacy(props)
    ? (props.files || [])
    : (props.images || []);

  const push = (arr: (ApiImage | File)[]) => {
    if (isLegacy(props)) props.setFiles(arr as File[]);
    else props.onChange(arr);
  };

  const atLimit = typeof limit === 'number' && items.length >= limit;
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const previews = React.useMemo(() => {
    return items.map((it) => (it instanceof File ? URL.createObjectURL(it) : it.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((x) => (x instanceof File ? `${x.name}-${x.size}-${x.lastModified}` : (x as ApiImage).url)).join('|')]);

  React.useEffect(() => {
    return () => {
      previews.forEach((u) => u.startsWith('blob:') && URL.revokeObjectURL(u));
    };
  }, [previews]);

  // dodawanie plików
  const addFiles = (list: File[]) => {
    const imgs = list.filter((f) => f.type.startsWith('image/'));
    if (imgs.length === 0) return;
    const space = typeof limit === 'number' ? Math.max(0, limit - items.length) : imgs.length;
    if (space <= 0) return;
    push([...items, ...imgs.slice(0, space)]);
  };

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  // DnD reorder (miniatury)
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);
  const [overIdx, setOverIdx] = React.useState<number | null>(null);

  const onDragStart = (i: number) => (e: React.DragEvent) => {
    setDragIdx(i);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const onDragOverItem = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx !== null) setOverIdx(i);
    e.dataTransfer.dropEffect = 'move';
  };

  const onDropReorder = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return; }

    const next = items.slice();
    const [el] = next.splice(dragIdx, 1);
    next.splice(i, 0, el);

    // zaktualizuj lokalne pole order (ułatwia spójność z backendem)
    const normalized = next.map((it, idx) => {
      if (it && !(it instanceof File)) {
        return { ...(it as ApiImage), order: idx + 1 }; // 1-indeksowo
      }
      return it;
    });

    setDragIdx(null);
    setOverIdx(null);
    push(normalized);
  };

  const onDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  // DnD na cały kontener (dodawanie plików)
  const onContainerDragOver = (e: React.DragEvent) => {
    if (Array.from(e.dataTransfer.types).includes('Files')) e.preventDefault();
  };
  const onContainerDrop = (e: React.DragEvent) => {
    if (dragIdx !== null) return;
    if (Array.from(e.dataTransfer.types).includes('Files')) {
      e.preventDefault();
      addFiles(Array.from(e.dataTransfer.files || []));
    }
  };

  const removeAt = (i: number) => {
    const itemToRemove = items[i];
    if (props.onDelete) {
      props.onDelete(itemToRemove as any);
    } else {
      const next = items.slice();
      next.splice(i, 1);
      push(next);
    }
  };

  const itemClass = (i: number) => {
    const isDragging = dragIdx === i;
    const isOver = overIdx === i && dragIdx !== null && dragIdx !== i;
    return [
      'group relative h-28 w-36 overflow-hidden rounded-2xl border bg-gray-50 shadow-sm',
      'transition-transform duration-150 ease-out will-change-transform select-none',
      isDragging ? 'scale-95 opacity-70 ring-2 ring-rose-300' : '',
      isOver ? 'scale-105 ring-2 ring-blue-300' : '',
      'cursor-move',
    ].join(' ');
  };

  return (
    <div className="space-y-2" onDragOver={onContainerDragOver} onDrop={onContainerDrop}>
      {label && <div className="text-sm font-medium text-gray-900">{label}</div>}
      {hint && <div className="text-xs text-gray-500">{hint}</div>}

      <div className="flex flex-wrap gap-3">
        {/* Kafelek dodawania */}
        <button
          type="button"
          onClick={() => !atLimit && inputRef.current?.click()}
          className={[
            'grid h-28 w-36 place-items-center rounded-2xl border-2 border-dashed transition',
            atLimit
              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/40',
          ].join(' ')}
          title={atLimit ? 'Osiągnięto limit' : 'Dodaj zdjęcia – kliknij lub przeciągnij'}
        >
          <div className="flex flex-col items-center gap-1 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            <span className="text-gray-600 whitespace-nowrap">Dodaj zdjęcia</span>
            {!atLimit && <span className="text-[11px] text-gray-400 whitespace-nowrap">Kliknij lub przeciągnij</span>}
          </div>
        </button>

        {/* Miniatury */}
        {items.map((it, i) => {
          const src = previews[i];
          const key =
            (it as any)?.id ??
            (it instanceof File ? `${it.name}-${it.size}-${it.lastModified}` : `${src}-${i}`);

          return (
            <div
              key={key}
              className={itemClass(i)}
              draggable
              onDragStart={onDragStart(i)}
              onDragOver={onDragOverItem(i)}
              onDrop={onDropReorder(i)}
              onDragEnd={onDragEnd}
              aria-grabbed={dragIdx === i}
            >
              {src ? (
                <img src={src} alt="" className="h-full w-full object-cover pointer-events-none" />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs text-gray-500">Brak podglądu</div>
              )}

              {showPrimaryBadge && i === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow">
                  Miniatura
                </span>
              )}

              <span className="absolute left-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                #{i + 1}
              </span>

              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-400 text-white shadow-md hover:bg-rose-500 active:scale-95 transition"
                title="Usuń"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6 6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handlePick}
      />
    </div>
  );
}
