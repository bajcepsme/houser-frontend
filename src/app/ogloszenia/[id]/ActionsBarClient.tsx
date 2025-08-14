'use client';

export default function ActionsBarClient({ title }: { title?: string }) {
  const doPrint = () => window.print();
  const doShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: title || 'Ogłoszenie', url });
      } else {
        await navigator.clipboard?.writeText(url);
        alert('Link skopiowany do schowka');
      }
    } catch {
      /* pomijamy anulowanie share */
    }
  };

  return (
    <div className="mt-3 flex items-center justify-end gap-2">
      <button className="btn-ghost" onClick={doPrint}>Drukuj</button>
      <button className="btn-primary" onClick={doShare}>Udostępnij</button>
    </div>
  );
}
