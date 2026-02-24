'use client';

import { useMemo, useState } from 'react';
import { GoogleMap, InfoWindow, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import type { UserLocation } from '@/lib/types';

type Props = {
  markers: UserLocation[];
  onAddPoint?: (lat: number, lng: number) => void;
};

const mapContainerStyle = {
  width: '100%',
  height: '520px'
};

const center = {
  lat: 35,
  lng: 35
};

export default function WorldMap({ markers, onAddPoint }: Props) {
  const [active, setActive] = useState<UserLocation | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  const countries = useMemo(
    () => ['all', ...Array.from(new Set(markers.map((m) => m.country))).sort()],
    [markers]
  );

  const cities = useMemo(() => {
    const filteredByCountry = countryFilter === 'all' ? markers : markers.filter((m) => m.country === countryFilter);
    return ['all', ...Array.from(new Set(filteredByCountry.map((m) => m.city))).sort()];
  }, [markers, countryFilter]);

  const filteredMarkers = useMemo(
    () =>
      markers.filter((marker) => {
        const matchesCountry = countryFilter === 'all' || marker.country === countryFilter;
        const matchesCity = cityFilter === 'all' || marker.city === cityFilter;
        return matchesCountry && matchesCity;
      }),
    [markers, countryFilter, cityFilter]
  );

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="nm-card rounded-xl p-5 text-sm text-gold-400">
        Добавьте `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` в `.env.local`, чтобы включить карту Google Maps.
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded border border-gold-500/30 bg-black px-3 py-2 text-sm"
          value={countryFilter}
          onChange={(e) => {
            setCountryFilter(e.target.value);
            setCityFilter('all');
          }}
        >
          {countries.map((country) => (
            <option key={country} value={country}>
              {country === 'all' ? 'Все страны' : country}
            </option>
          ))}
        </select>

        <select
          className="rounded border border-gold-500/30 bg-black px-3 py-2 text-sm"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          {cities.map((city) => (
            <option key={city} value={city}>
              {city === 'all' ? 'Все города' : city}
            </option>
          ))}
        </select>
      </div>

      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={2}
          options={{
            disableDefaultUI: false,
            styles: [
              {
                elementType: 'geometry',
                stylers: [{ color: '#0b0b0b' }]
              },
              {
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d4af37' }]
              }
            ]
          }}
          onClick={(event) => {
            const lat = event.latLng?.lat();
            const lng = event.latLng?.lng();
            if (onAddPoint && typeof lat === 'number' && typeof lng === 'number') {
              onAddPoint(lat, lng);
            }
          }}
        >
          {filteredMarkers.map((marker) => (
            <MarkerF
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() => setActive(marker)}
              icon="/images/gold-marker.svg"
            />
          ))}

          {active ? (
            <InfoWindow position={{ lat: active.lat, lng: active.lng }} onCloseClick={() => setActive(null)}>
              <div className="text-black">
                <p className="font-semibold">{active.name}</p>
                <p className="text-xs">
                  {active.city}, {active.country}
                </p>
              </div>
            </InfoWindow>
          ) : null}
        </GoogleMap>
      ) : (
        <div className="nm-card rounded-xl p-5 text-sm text-gold-400">Загрузка карты...</div>
      )}
    </section>
  );
}
