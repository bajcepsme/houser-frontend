'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Lightbox from './Lightbox';

type ListingImage = { id: number; path: string; order: number };

export default function Gallery({
  images,
  baseUrl,
}: {
  images: ListingImage[];
  baseUrl: string;
}) {
  const sorted = [...images].sort((a, b) => a.order - b.order);
  const [selected, setSelected] = useState(0);
  const [isLightbox, setIsLightbox] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [thumbsRef, thumbsApi] = useEmblaCarousel({ containScroll: 'keepSnaps', dragFree: true });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    setSelected(idx);
    thumbsApi?.scrollTo(idx);
  }, [emblaApi, thumbsApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const scrollTo = (index: number, openLightbox = false) => {
    emblaApi?.scrollTo(index);
    if (openLightbox) setIsLightbox(true);
  };

  return (
    <div className="w-full">
      {/* Duże zdjęcia */}
      <div
        className="overflow-hidden rounded-xl bg-gray-100 cursor-zoom-in"
        ref={emblaRef}
        onClick={() => setIsLightbox(true)} // klik w główne zdjęcie -> lightbox
        title="Kliknij, aby powiększyć"
      >
        <div className="flex">
          {sorted.map((img) => (
            <div key={img.id} className="min-w-0 flex-[0_0_100%]">
              <img
                src={`${baseUrl}/storage/${img.path}`}
                alt=""
                className="w-full h-[420px] md:h-[520px] object-cover select-none"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Miniatury */}
      <div className="mt-3">
        <div className="overflow-hidden" ref={thumbsRef}>
          <div className="flex gap-2">
            {sorted.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => scrollTo(idx, true)} // klik w miniaturę -> przejdź i otwórz lightbox
                className={`relative rounded-lg overflow-hidden border transition focus:outline-none ${
                  selected === idx ? 'border-blue-600 ring-2 ring-blue-300' : 'border-transparent'
                }`}
                title={`Powiększ zdjęcie ${idx + 1}`}
              >
                <img
                  src={`${baseUrl}/storage/${img.path}`}
                  alt=""
                  className="w-24 h-16 md:w-28 md:h-20 object-cover select-none"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {sorted.length > 0 && <span>{selected + 1} / {sorted.length}</span>}
        </div>
      </div>

      {/* Lightbox */}
      {isLightbox && (
        <Lightbox
          images={sorted.map(({ id, path }) => ({ id, path }))}
          baseUrl={baseUrl}
          startIndex={selected}
          onClose={() => setIsLightbox(false)}
        />
      )}
    </div>
  );
}