'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { GoogleMap, InfoWindow, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import type { CityMapMarker } from '@/lib/types';

type Props = {
  markers: CityMapMarker[];
  selectedCityId?: string | null;
  onSelectCity?: (cityId: string) => void;
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

const LeafletCityMap = dynamic(() => import('@/components/map/LeafletCityMap'), {
  ssr: false,
  loading: () => <div className="nm-card rounded-[1.6rem] p-5 text-sm text-gold-400">Загрузка карты...</div>
});

type GoogleCityMapProps = {
  markers: CityMapMarker[];
  active: CityMapMarker | null;
  onSetActive: (marker: CityMapMarker | null) => void;
  onSelectCity?: (cityId: string) => void;
  onAddPoint?: (lat: number, lng: number) => void;
  googleApiKey: string;
};

function GoogleCityMap({
  markers,
  active,
  onSetActive,
  onSelectCity,
  onAddPoint,
  googleApiKey
}: GoogleCityMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleApiKey
  });

  if (!isLoaded) {
    return <div className="nm-card rounded-[1.6rem] p-5 text-sm text-gold-400">Загрузка карты...</div>;
  }

  return (
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
      {markers.map((marker) => (
        <MarkerF
          key={marker.id}
          position={{ lat: marker.lat, lng: marker.lng }}
          onClick={() => {
            onSetActive(marker);
            onSelectCity?.(marker.id);
          }}
          icon="/images/gold-marker.svg"
          label={
            marker.members.length > 1
              ? {
                  text: String(marker.members.length),
                  color: '#050505',
                  fontWeight: '700'
                }
              : undefined
          }
        />
      ))}

      {active ? (
        <InfoWindow position={{ lat: active.lat, lng: active.lng }} onCloseClick={() => onSetActive(null)}>
          <div className="text-black">
            <p className="font-semibold">
              {active.city}, {active.country}
            </p>
            <p className="text-xs">{active.members.length} профилей в городе</p>
            <p className="mt-1 text-xs text-black/70">
              {active.members
                .slice(0, 3)
                .map((member) => member.name)
                .join(', ')}
              {active.members.length > 3 ? '…' : ''}
            </p>
          </div>
        </InfoWindow>
      ) : null}
    </GoogleMap>
  );
}

export default function WorldMap({ markers, selectedCityId, onSelectCity, onAddPoint }: Props) {
  const [active, setActive] = useState<CityMapMarker | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';

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

  useEffect(() => {
    if (!selectedCityId) {
      return;
    }

    const selectedMarker = markers.find((marker) => marker.id === selectedCityId) || null;
    setActive(selectedMarker);
  }, [markers, selectedCityId]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="nm-pill rounded-full px-4 py-3 text-sm uppercase tracking-[0.14em]"
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
          className="nm-pill rounded-full px-4 py-3 text-sm uppercase tracking-[0.14em]"
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

      {googleApiKey ? (
        <GoogleCityMap
          markers={filteredMarkers}
          active={active}
          onSetActive={setActive}
          onSelectCity={onSelectCity}
          onAddPoint={onAddPoint}
          googleApiKey={googleApiKey}
        />
      ) : (
        <LeafletCityMap
          markers={filteredMarkers}
          selectedCityId={selectedCityId}
          onSelectCity={onSelectCity}
          onAddPoint={onAddPoint}
        />
      )}
    </section>
  );
}
