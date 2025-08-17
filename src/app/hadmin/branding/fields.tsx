'use client';

import * as React from 'react';

/* ========= Helpers ========= */

function cls(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(' ');
}

export type Option = [string, string];

/* ========= Shared Row ========= */

export function Row({ cols = 2, children }: { cols?: 1 | 2 | 3 | 4; children: React.ReactNode }) {
  return <div className={cls('grid gap-3', cols === 1 && 'grid-cols-1', cols === 2 && 'grid-cols-2', cols === 3 && 'grid-cols-3', cols === 4 && 'grid-cols-4')}>{children}</div>;
}

/* ========= Text ========= */

export function TextField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id?: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const [_v, setV] = React.useState(value ?? '');

  // Sync zewnętrznej zmiany -> input (bez onChange)
  React.useEffect(() => {
    setV(value ?? '');
  }, [value]);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        value={_v}
        placeholder={placeholder}
        onChange={(e) => {
          const nv = e.target.value;
          setV(nv);
          onChange(nv);
        }}
        className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 focus:border-gray-300"
      />
    </div>
  );
}

/* ========= Number / Range ========= */

export function RangeField({
  id,
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  id?: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const [_v, setV] = React.useState<number>(value ?? 0);

  React.useEffect(() => {
    setV(value ?? 0);
  }, [value]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <span className="tabular-nums text-gray-800">{_v}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={_v}
        onChange={(e) => {
          const nv = Number(e.target.value);
          setV(nv);
          if (nv !== value) onChange(nv);
        }}
        className="w-full accent-brand-600"
      />
    </div>
  );
}

/* ========= Select ========= */

export function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id?: string;
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 focus:border-gray-300"
      >
        {options.map(([val, lab]) => (
          <option key={val} value={val}>
            {lab}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ========= Checkbox ========= */

export function CheckboxField({
  id,
  label,
  checked,
  onChange,
}: {
  id?: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex select-none items-center gap-2 text-sm text-gray-700">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600"
      />
      {label}
    </label>
  );
}

/* ========= Color =========
   Bez żadnego onChange w useEffect!
   Trzymamy lokalny string, synchronizujemy się z propsami,
   a zmiany do góry wysyłamy tylko z eventów onChange.
*/
export function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [_v, setV] = React.useState(value ?? '');

  React.useEffect(() => {
    // Tylko synchronizacja do inputa (bez wywołania onChange)
    setV(value ?? '');
  }, [value]);

  // jeśli da się sparsować HEX z #RRGGBB – pokaż w color pickerze
  const hex = toHexOrNull(_v);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex ?? '#ffffff'}
          onChange={(e) => {
            const nv = e.target.value; // #rrggbb
            // Jeśli oryginał był np. rgba(), to zachowaj format HEX
            setV(nv);
            if (nv !== value) onChange(nv);
          }}
          className="h-9 w-10 cursor-pointer rounded-lg border border-gray-200 bg-white p-0"
          title={_v}
        />

        <input
          id={id}
          value={_v}
          onChange={(e) => {
            const nv = e.target.value;
            setV(nv);
            if (nv !== value) onChange(nv);
          }}
          className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 focus:border-gray-300"
          placeholder="np. #111827 lub rgba(0,0,0,.5)"
        />
      </div>
    </div>
  );
}

function toHexOrNull(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (/^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(s)) return normalizeHex(s);
  // rgba(...) -> nie wymuszamy konwersji (picker pokaże ostatni hex)
  return null;
}

function normalizeHex(s: string) {
  const v = s.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    // #abc -> #aabbcc
    return (
      '#' +
      v[1] +
      v[1] +
      v[2] +
      v[2] +
      v[3] +
      v[3]
    );
  }
  return v;
}
