"use client";

import { useEffect, useRef, useState } from "react";

type Option = { label: string; value: string; className?: string };

export default function CustomSelect({
  name,
  placeholder,
  value,
  onChange,
  options,
}: {
  name: string;
  placeholder: string;
  value?: string;
  onChange: (v: string) => void;
  options: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState<number>(-1);
  const ref = useRef<HTMLDivElement | null>(null);

  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIndex((i) => Math.min(options.length - 1, i + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex((i) => Math.max(0, i - 1));
      }
      if (e.key === "Enter" && focusIndex >= 0) {
        e.preventDefault();
        onChange(options[focusIndex].value);
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, focusIndex, options, onChange]);

  return (
    <div className={`custom-select ${open ? "opened" : ""}`} ref={ref}>
      <div
        className="custom-select-header custom-select-trigger"
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
      >
        <span>{current?.label ?? placeholder}</span>
        <i className="cs-caret" aria-hidden />
      </div>

      {open && (
        <div className="custom-select-options" role="listbox" tabIndex={-1}>
          {options.map((opt, idx) => (
            <div
              key={opt.value}
              className={`custom-option ${opt.className ?? ""} ${opt.value === value ? "selection" : ""} ${
                idx === focusIndex ? "focus" : ""
              }`}
              role="option"
              aria-selected={opt.value === value}
              onMouseEnter={() => setFocusIndex(idx)}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
      <input type="hidden" name={name} value={value ?? ""} />
    </div>
  );
}
