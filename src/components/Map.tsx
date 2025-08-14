'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Naprawiamy problem z domyślną ikoną w Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function Map({ listings }: { listings: any[] }) {
    // Ustawiamy środek mapy na Polskę, jeśli nie ma ogłoszeń
    const position: [number, number] = listings.length > 0 && listings[0].latitude
        ? [listings[0].latitude, listings[0].longitude]
        : [52.237, 21.017];

    return (
        <MapContainer center={position} zoom={listings.length > 0 ? 13 : 6} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {listings.map(listing => (
                listing.latitude && listing.longitude && (
                    <Marker key={listing.id} position={[listing.latitude, listing.longitude]}>
                        <Popup>
                            <strong>{listing.title}</strong><br />
                            Cena: {(listing.price / 100).toLocaleString('pl-PL')} PLN
                        </Popup>
                    </Marker>
                )
            ))}
        </MapContainer>
    );
}