import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Youtube, Mail, Phone } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  const Social = ({ href, children, label }: any) => (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
    >
      {children}
    </Link>
  );

  return (
    <footer className="mt-12 border-t border-gray-100 bg-white">
      {/* cienka linia z delikatnym gradientem – sterowana w globals.css (opcjonalna) */}
      <div className="footer-gradient h-px w-full" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top */}
        <div className="grid gap-10 py-12 md:grid-cols-4">
          {/* Brand + opis + social */}
          <div>
            <Link href="/" className="text-2xl font-extrabold tracking-tight text-gray-900">
              <span className="text-brand-600">houser</span>.pl
            </Link>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Nowoczesny serwis nieruchomości. Proste dodawanie ofert, świetne
              wrażenia dla kupujących i sprzedających.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <Social href="#" label="Facebook">
                <Facebook className="h-5 w-5" />
              </Social>
              <Social href="#" label="Instagram">
                <Instagram className="h-5 w-5" />
              </Social>
              <Social href="#" label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </Social>
              <Social href="#" label="YouTube">
                <Youtube className="h-5 w-5" />
              </Social>
            </div>
          </div>

          {/* Kolumna 1 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Dla kupujących</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li><Link className="hover:text-gray-900" href="/ogloszenia">Wszystkie ogłoszenia</Link></li>
              <li><Link className="hover:text-gray-900" href="/kategorie">Kategorie</Link></li>
              <li><Link className="hover:text-gray-900" href="/wyszukaj">Wyszukiwarka</Link></li>
              <li><Link className="hover:text-gray-900" href="/blog">Poradniki</Link></li>
            </ul>
          </div>

          {/* Kolumna 2 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Dla sprzedających</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li><Link className="hover:text-gray-900" href="/dodaj-ogloszenie">Dodaj ogłoszenie</Link></li>
              <li><Link className="hover:text-gray-900" href="/cennik">Cennik i pakiety</Link></li>
              <li><Link className="hover:text-gray-900" href="/moje-konto">Panel ogłoszeniodawcy</Link></li>
            </ul>
          </div>

          {/* Kolumna 3 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Kontakt</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> kontakt@houser.pl
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> +48 123 456 789
              </li>
              <li><Link className="hover:text-gray-900" href="/kontakt">Formularz kontaktowy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 py-6 text-sm text-gray-500 md:flex-row">
          <p>© {year} Houser.pl. Wszelkie prawa zastrzeżone.</p>
          <div className="flex items-center gap-4">
            <Link href="/regulamin" className="hover:text-gray-700">Regulamin</Link>
            <Link href="/polityka-prywatnosci" className="hover:text-gray-700">Polityka prywatności</Link>
            <Link href="/mapa-strony" className="hover:text-gray-700">Mapa strony</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
