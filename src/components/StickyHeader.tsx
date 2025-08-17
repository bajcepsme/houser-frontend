"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

type Me = { id: string | number; name?: string; avatar_url?: string };

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
}

export default function StickyHeader() {
  const [solid, setSolid] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // pobierz sesję użytkownika (cookie session)
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/api/v1/me`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setMe({ id: json?.id, name: json?.name || json?.username, avatar_url: json?.avatar_url });
        } else {
          setMe(null);
        }
      } catch {
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <header className={`site-header ${solid ? "is-solid" : ""}`}>
      <div className="container header-inner">
        <Link href="/" className="header-logo">
          <Image src="/houser-logo.svg" alt="houser" width={110} height={32} priority />
        </Link>

        <nav className="header-nav">
          <Link href="/ogloszenia">Ogłoszenia</Link>
          <Link href="/kategorie">Kategorie</Link>
          <Link href="/nowe-oferty">Nowe oferty</Link>
          <Link href="/lokalizacje">Lokalizacje</Link>
          <Link href="/agencje">Agencje</Link>
          <Link href="/deweloperzy">Deweloperzy</Link>
        </nav>

        <div className="header-cta">
          {!loading && me ? (
            <Link href="/moje-konto" className="user-chip" title="Twoje konto">
              <span className="user-name">{me.name || "Konto"}</span>
              <span className="user-avatar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={me.avatar_url || "/images/avatars/default.png"}
                  alt="avatar"
                  width={28}
                  height={28}
                />
              </span>
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Zaloguj</Link>
              <Link href="/dodaj-ogloszenie" className="btn-primary">Dodaj ogłoszenie</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
