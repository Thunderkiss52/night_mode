'use client';

import { useEffect, useMemo, useState } from 'react';
import WorldMap from '@/components/map/WorldMap';
import { apiUrl } from '@/lib/api';
import { authHeaders, getStoredApiUid } from '@/lib/auth-client';
import type { CityMapMarker, UserLocation } from '@/lib/types';

type Props = {
  initialMarkers: UserLocation[];
  myUid?: string;
};

type LocationApi = {
  id: string;
  uid: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  created_at: string;
};

function fromApiLocation(item: LocationApi): UserLocation {
  return {
    id: item.id,
    uid: item.uid,
    name: item.name,
    city: item.city,
    country: item.country,
    lat: item.lat,
    lng: item.lng,
    createdAt: item.created_at
  };
}

function buildCityMarkers(locations: UserLocation[]): CityMapMarker[] {
  const grouped = new Map<string, UserLocation[]>();

  for (const location of locations) {
    const key = `${location.country}::${location.city}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(location);
    } else {
      grouped.set(key, [location]);
    }
  }

  return Array.from(grouped.entries())
    .map(([key, members]) => {
      const lat = members.reduce((sum, member) => sum + member.lat, 0) / members.length;
      const lng = members.reduce((sum, member) => sum + member.lng, 0) / members.length;

      return {
        id: key,
        city: members[0].city,
        country: members[0].country,
        lat,
        lng,
        members: [...members].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      };
    })
    .sort((left, right) => {
      if (right.members.length !== left.members.length) {
        return right.members.length - left.members.length;
      }
      return left.city.localeCompare(right.city);
    });
}

function buildInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'NM';
  }

  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
}

export default function MapClient({ initialMarkers, myUid = 'demo-user-1' }: Props) {
  const [markers, setMarkers] = useState<UserLocation[]>(initialMarkers);
  const [actorUid, setActorUid] = useState(myUid);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    setActorUid(getStoredApiUid(myUid));
  }, [myUid]);

  useEffect(() => {
    let active = true;

    async function loadLocations() {
      try {
        const response = await fetch(apiUrl('/api/locations'));
        if (!response.ok) return;
        const data = (await response.json()) as { locations?: LocationApi[] };
        if (!active || !data.locations) return;
        setMarkers(data.locations.map(fromApiLocation));
      } catch {
        // Keep demo markers when API is unavailable.
      }
    }

    loadLocations();

    return () => {
      active = false;
    };
  }, []);

  const cityMarkers = useMemo(() => buildCityMarkers(markers), [markers]);
  const ownCityCount = useMemo(() => {
    const ownCities = new Set(
      markers.filter((marker) => marker.uid === actorUid).map((marker) => `${marker.country}::${marker.city}`)
    );
    return ownCities.size;
  }, [markers, actorUid]);
  const selectedCity = useMemo(
    () => cityMarkers.find((marker) => marker.id === selectedCityId) || null,
    [cityMarkers, selectedCityId]
  );

  useEffect(() => {
    if (cityMarkers.length === 0) {
      setSelectedCityId(null);
      return;
    }

    if (!selectedCityId || !cityMarkers.some((marker) => marker.id === selectedCityId)) {
      setSelectedCityId(cityMarkers[0].id);
    }
  }, [cityMarkers, selectedCityId]);

  const onAddPoint = async (lat: number, lng: number) => {
    const uid = getStoredApiUid(actorUid);
    setSaveStatus('Определяем город и сохраняем локацию...');

    try {
      const response = await fetch(apiUrl('/api/locations'), {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          uid,
          name: 'You',
          city: 'Custom point',
          country: 'Unknown',
          lat,
          lng
        })
      });

      if (!response.ok) {
        setSaveStatus('Не удалось сохранить локацию.');
        return;
      }
      const data = (await response.json()) as { location?: LocationApi };
      if (!data.location) {
        setSaveStatus('Не удалось определить город.');
        return;
      }

      const persisted = fromApiLocation(data.location);
      setMarkers((prev) => [persisted, ...prev]);
      setSelectedCityId(`${persisted.country}::${persisted.city}`);
      setSaveStatus(`Локация сохранена: ${persisted.city}, ${persisted.country}`);
    } catch {
      setSaveStatus('Не удалось сохранить локацию.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="nm-card rounded-[1.6rem] p-4 text-sm">
        <p className="uppercase tracking-[0.2em] text-gold-400">Городов на карте: {cityMarkers.length}</p>
        <p className="mt-2 uppercase tracking-[0.2em] text-white/72">Профилей на карте: {markers.length}</p>
        <p className="mt-2 uppercase tracking-[0.2em] text-white/72">Ваших городов: {ownCityCount}</p>
        {saveStatus ? <p className="mt-3 text-xs text-gold-300">{saveStatus}</p> : null}
      </div>
      <WorldMap
        markers={cityMarkers}
        selectedCityId={selectedCityId}
        onSelectCity={setSelectedCityId}
        onAddPoint={onAddPoint}
      />
      <section className="nm-card rounded-[1.8rem] p-5">
        <div className="flex flex-col gap-3 border-b border-white/8 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold-400">Вид профилей</p>
            <h3 className="mt-2 text-2xl font-black text-white">
              {selectedCity ? `${selectedCity.city}, ${selectedCity.country}` : 'Выберите город на карте'}
            </h3>
          </div>
          <p className="max-w-md text-sm text-white/60">
            На карте показываются города, а ниже открываются профили участников выбранного города.
          </p>
        </div>

        {selectedCity ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {selectedCity.members.map((member) => (
              <article
                key={member.id}
                className="rounded-[1.4rem] border border-white/8 bg-black/70 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-500/30 bg-gold-500/10 text-sm font-black text-gold-400">
                    {buildInitials(member.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">{member.name}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-gold-400">
                      {member.city}, {member.country}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-white/52">
                  <span>{member.uid}</span>
                  <span>{new Date(member.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-white/60">Когда на карте появятся города, здесь отобразятся профили.</p>
        )}
      </section>
    </div>
  );
}
