'use client';

import * as React from 'react';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function FormSection({ title, subtitle, right, children, className = '' }: Props) {
  return (
    <section className={`card-modern p-5 md:p-6 ${className}`}>
      <div className="mb-4 flex items-start gap-3 justify-between">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle ? <p className="text-sm text-gray-500 mt-1">{subtitle}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
