'use client';

import * as React from 'react';

const CATEGORIES = [
  'Mieszkania',
  'Domy',
  'Działki',
  'Lokale usługowe',
  'Hale i magazyny',
  'Garaże',
  'Hotele i pensjonaty',
  'Pałace i zamki',
];

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function CategorySelect({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => {
        const active = value === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={active ? 'pill-active' : 'pill'}
            aria-pressed={active}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
