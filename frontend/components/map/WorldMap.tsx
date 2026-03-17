'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { GoogleMap, InfoWindow, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import type { Locale } from '@/lib/i18n';
import type { CityMapMarker } from '@/lib/types';

type Props = {
  locale: Locale;
  markers: CityMapMarker[];
  selectedCityId?: string | null;
  onSelectCity?: (cityId: string) => void;
  onAddPoint?: (lat: number, lng: number) => void;
  defaultCountry?: string;
  defaultCity?: string;
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
  locale: Locale;
  markers: CityMapMarker[];
  active: CityMapMarker | null;
  onSetActive: (marker: CityMapMarker | null) => void;
  onSelectCity?: (cityId: string) => void;
  onAddPoint?: (lat: number, lng: number) => void;
  googleApiKey: string;
};

function GoogleCityMap({
  locale,
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
            <p className="text-xs">
              {active.members.length > 0
                ? locale === 'ru'
                  ? `${active.members.length} профилей в городе`
                  : locale === 'en'
                    ? `${active.members.length} profiles in this city`
                    : locale === 'am'
                      ? `${active.members.length} պրոֆիլ այս քաղաքում`
                      : `${active.members.length} профиль осы қалада`
                : locale === 'ru'
                  ? 'Город готов для первых участников'
                  : locale === 'en'
                    ? 'Ready for the first Night Mode members'
                    : locale === 'am'
                      ? 'Պատրաստ է առաջին Night Mode մասնակիցների համար'
                      : 'Алғашқы Night Mode адамдарына дайын'}
            </p>
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

const copy: Record<
  Locale,
  {
    allCountries: string;
    allCities: string;
    loading: string;
  }
> = {
  ru: {
    allCountries: 'Все страны',
    allCities: 'Все города',
    loading: 'Загрузка карты...'
  },
  en: {
    allCountries: 'All countries',
    allCities: 'All cities',
    loading: 'Loading map...'
  },
  am: {
    allCountries: 'Բոլոր երկրները',
    allCities: 'Բոլոր քաղաքները',
    loading: 'Քարտեզը բեռնվում է...'
  },
  kk: {
    allCountries: 'Барлық елдер',
    allCities: 'Барлық қалалар',
    loading: 'Карта жүктелуде...'
  }
};

export default function WorldMap({
  locale,
  markers,
  selectedCityId,
  onSelectCity,
  onAddPoint,
  defaultCountry,
  defaultCity
}: Props) {
  const t = copy[locale];
  const [active, setActive] = useState<CityMapMarker | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [filtersInitialized, setFiltersInitialized] = useState(false);
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

  useEffect(() => {
    if (filtersInitialized || countries.length === 0) {
      return;
    }

    const initialCountry = defaultCountry && countries.includes(defaultCountry) ? defaultCountry : 'all';
    const filteredByCountry = initialCountry === 'all' ? markers : markers.filter((marker) => marker.country === initialCountry);
    const nextCities = ['all', ...Array.from(new Set(filteredByCountry.map((marker) => marker.city))).sort()];
    const initialCity = defaultCity && nextCities.includes(defaultCity) ? defaultCity : 'all';

    setCountryFilter(initialCountry);
    setCityFilter(initialCity);
    setFiltersInitialized(true);
  }, [countries, defaultCity, defaultCountry, filtersInitialized, markers]);

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
              {country === 'all' ? t.allCountries : country}
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
              {city === 'all' ? t.allCities : city}
            </option>
          ))}
        </select>
      </div>

      {googleApiKey ? (
        <GoogleCityMap
          locale={locale}
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
