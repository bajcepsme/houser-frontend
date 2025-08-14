'use client';
import React from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function VideoField({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">Link do filmu (YouTube)</label>
      <input
        className="form-input w-full"
        placeholder="np. https://www.youtube.com/watch?v=XXXX"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-xs text-gray-500 mt-1">
        Wklej pełny adres URL filmu. (Opcjonalnie)
      </p>
    </div>
  );
}
