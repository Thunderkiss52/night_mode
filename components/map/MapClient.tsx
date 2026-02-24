'use client';

import { useEffect, useMemo, useState } from 'react';
import WorldMap from '@/components/map/WorldMap';
import { apiUrl } from '@/lib/api';
import { authHeaders, getStoredApiUid } from '@/lib/auth-client';
import type { UserLocation } from '@/lib/types';

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

export default function MapClient({ initialMarkers, myUid = 'demo-user-1' }: Props) {
  const [markers, setMarkers] = useState<UserLocation[]>(initialMarkers);
  const [actorUid, setActorUid] = useState(myUid);

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

  const ownMarkersCount = useMemo(() => markers.filter((marker) => marker.uid === actorUid).length, [markers, actorUid]);

  const onAddPoint = async (lat: number, lng: number) => {
    const uid = getStoredApiUid(actorUid);

    const optimistic: UserLocation = {
      id: `local-${Date.now()}`,
      uid,
      name: 'You',
      city: 'Custom point',
      country: 'Unknown',
      lat,
      lng,
      createdAt: new Date().toISOString()
    };

    setMarkers((prev) => [optimistic, ...prev]);

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

      if (!response.ok) return;
      const data = (await response.json()) as { location?: LocationApi };
      if (!data.location) return;

      const persisted = fromApiLocation(data.location);
      setMarkers((prev) => [persisted, ...prev.filter((item) => item.id !== optimistic.id)]);
    } catch {
      // Keep optimistic marker for better UX.
    }
  };

  return (
    <div className="space-y-4">
      <div className="nm-card rounded-xl p-4 text-sm">
        <p className="text-gold-400">Всего точек: {markers.length}</p>
        <p className="text-gold-400">Ваши точки: {ownMarkersCount}</p>
      </div>
      <WorldMap markers={markers} onAddPoint={onAddPoint} />
    </div>
  );
}
