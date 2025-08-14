'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type Img = { id: number; path: string };

export default function Lightbox({
  images,
  baseUrl,
  startIndex = 0,
  onClose,
}: {
  images: Img[];
  baseUrl: string;
  startIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const total = images.length;
  const src = useMemo(() => `${baseUrl}/storage/${images[index].path}`, [baseUrl, images, index]);

  // blokada scrolla tła + obsługa klawiatury
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % total);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + total) % total);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, total]);

  const goPrev = () => setIndex((i) => (i - 1 + total) % total);
  const goNext = () => setIndex((i) => (i + 1) % total);

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Główne zdjęcie */}
      <div className="relative max-w-[95vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt=""
          className="max-w-[95vw] max-h-[90vh] object-contain select-none"
          draggable={false}
        />

        {/* Zamknij */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 px-3 py-1.5 rounded-md bg-white/90 text-black text-sm font-semibold hover:bg-white"
          aria-label="Zamknij"
        >
          Zamknij ✕
        </button>

        {/* Pasek info */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white text-xs bg-black/40 px-2 py-1 rounded">
          {index + 1} / {total}
        </div>

        {/* Strzałki */}
        {total > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 w-10 h-10 flex items-center justify-center hover:bg-white"
              aria-label="Poprzednie"
            >
              ‹
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 w-10 h-10 flex items-center justify-center hover:bg-white"
              aria-label="Następne"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}