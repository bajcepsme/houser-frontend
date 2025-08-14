'use client';

import { useState, useEffect } from 'react';
import ListingCard from '@/components/ListingCard';
import dynamic from 'next/dynamic';

// Dynamiczny import mapy - będzie ładowana tylko po stronie klienta
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function SearchPage() {
  const [listings, setListings] = useState([]);
  // ... reszta stanów ...
  const [city, setCity] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');

  // ... fetchListings i handleSearch bez zmian ...
  const fetchListings = async (searchParams: URLSearchParams) => {
    const query = searchParams.toString();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/listings?${query}`);
    const data = await res.json();
    setListings(data);
  };
  useEffect(() => {
    fetchListings(new URLSearchParams());
  }, []);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (priceFrom) params.append('price_from', priceFrom);
    if (priceTo) params.append('price_to', priceTo);
    fetchListings(params);
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Wyszukaj Ogłoszenia</h1>
      <form onSubmit={handleSearch} className="bg-gray-100 p-4 rounded-lg mb-8 flex gap-4 items-end">
        {/* ... formularz bez zmian ... */}
        <div>
          <label htmlFor="city">Miasto</label>
          <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
        </div>
        <div>
          <label htmlFor="priceFrom">Cena od</label>
          <input type="number" id="priceFrom" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
        </div>
        <div>
          <label htmlFor="priceTo">Cena do</label>
          <input type="number" id="priceTo" value={priceTo} onChange={(e) => setPriceTo(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">Filtruj</button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ height: '70vh' }}>
        {/* Kolumna z mapą */}
        <div className="bg-gray-200 rounded-lg overflow-hidden">
          <Map listings={listings} />
        </div>

        {/* Kolumna z wynikami */}
        <div className="overflow-y-auto space-y-4">
          {listings.length === 0 ? (
            <p>Brak ogłoszeń.</p>
          ) : (
            listings.map((listing: any) => (
              <ListingCard key={listing.id} listing={listing} />
            ))
          )}
        </div>
      </div>
    </main>
  );
}