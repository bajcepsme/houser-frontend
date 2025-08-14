'use client';

import dynamic from 'next/dynamic';
import React from 'react';

export type Props = {
  onCityChange: (city: string) => void;
  onRegionChange: (region: string) => void;
  onCoordsChange: (lat: number, lng: number) => void;
  initialCity?: string;
  initialRegion?: string;
  initialCoords?: [number, number] | null;
  street?: string;
  onStreetChange?: (street: string) => void;
  showStreet?: boolean; // domyślnie true
};

// Komponent wewnętrzny jest ładowany dynamicznie, co jest świetną praktyką dla ciężkich bibliotek jak Leaflet
const LocationPickerInner = dynamic<Props>(() => import('./LocationPickerInner'), {
  ssr: false,
  loading: () => (
    <div className="h-64 rounded-xl border border-gray-200/70 bg-white/70 animate-pulse" />
  ),
});

// Ten wrapper jest w porządku, przekazuje propsy dalej
export default function LocationPicker(props: Props) {
  return <LocationPickerInner {...props} />;
}