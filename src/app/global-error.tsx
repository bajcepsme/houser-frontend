'use client';

import * as React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Możesz zalogować do Sentry/Logera
    // console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: 24, fontFamily: 'ui-sans-serif, system-ui' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Coś poszło nie tak
          </h1>
          <p style={{ color: '#475569', marginBottom: 16 }}>
            Wystąpił błąd podczas renderowania. Spróbuj ponownie.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              background: '#111827',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            Odśwież widok
          </button>
        </div>
      </body>
    </html>
  );
}
