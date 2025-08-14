import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header"; 
import 'leaflet/dist/leaflet.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Houser.pl 2.0",
  description: "Nowoczesny serwis nieruchomości zbudowany z Laravel i Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        {/* 2. Owijamy całą aplikację (reprezentowaną przez 'children') w nasz AuthProvider */}
        {/* Od teraz, każdy komponent wewnątrz będzie miał dostęp do kontekstu logowania. */}
       <AuthProvider>
          <Header /> {}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}