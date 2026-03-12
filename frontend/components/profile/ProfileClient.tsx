'use client';

import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';
import { fetchCurrentUser, getStoredApiUid } from '@/lib/auth-client';
import ItemsGrid from '@/components/profile/ItemsGrid';
import ProfileCard from '@/components/profile/ProfileCard';
import AuthSessionPanel from '@/components/profile/AuthSessionPanel';
import type { UserLocation, UserProfile } from '@/lib/types';

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

function buildProfile(uid: string, locations: UserLocation[]): UserProfile {
  const latestLocation = locations[0];

  return {
    uid,
    name: latestLocation?.name || uid,
    city: latestLocation?.city || 'Unknown city',
    country: latestLocation?.country || 'Unknown country',
    socials: {}
  };
}

export default function ProfileClient() {
  const [profile, setProfile] = useState<UserProfile>(() => buildProfile(getStoredApiUid(), []));
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [status, setStatus] = useState('Загружаем профиль из API...');

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const fallbackUid = getStoredApiUid();

      try {
        const [currentUser, locationsResponse] = await Promise.all([
          fetchCurrentUser(),
          fetch(apiUrl('/api/locations'))
        ]);
        const locationsData = locationsResponse.ok
          ? ((await locationsResponse.json()) as { locations?: LocationApi[] })
          : null;

        if (!active) return;

        const uid = currentUser?.id || fallbackUid;
        const allLocations = (locationsData?.locations || []).map(fromApiLocation);
        const ownLocations = allLocations
          .filter((item) => item.uid === uid)
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

        setProfile({
          uid,
          name:
            [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ').trim() ||
            currentUser.username ||
            ownLocations[0]?.name ||
            uid,
          photo: currentUser.photo_url || undefined,
          city: ownLocations[0]?.city || 'Unknown city',
          country: ownLocations[0]?.country || 'Unknown country',
          socials: {}
        });
        setLocations(ownLocations);
        setStatus(
          'Профиль загружен из backend auth/API. Данные о мерче пока не поддерживаются отдельным endpoint.'
        );
      } catch {
        if (!active) return;
        setProfile(buildProfile(fallbackUid, []));
        setLocations([]);
        setStatus('Backend недоступен. Доступны только локально сохранённый UID и пустые секции.');
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <ProfileCard profile={profile} />
      <section className="nm-card rounded-2xl p-4 text-sm text-white/68">
        {status}
      </section>
      <AuthSessionPanel />

      <section className="nm-card rounded-2xl p-5">
        <h3 className="text-xl font-bold text-gold-400">Мои точки</h3>
        {locations.length > 0 ? (
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {locations.map((point) => (
              <p key={point.id} className="rounded border border-gold-500/20 bg-black/40 px-3 py-2">
                {point.city}, {point.country} ({point.lat.toFixed(2)}, {point.lng.toFixed(2)})
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-white/60">У текущего пользователя пока нет точек в `/api/locations`.</p>
        )}
      </section>

      <ItemsGrid items={[]} />
    </div>
  );
}
