'use client';

import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';
import { fetchCurrentUser, getStoredApiUid, loginWithTelegram, waitForTelegramInitData } from '@/lib/auth-client';
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
  const [status, setStatus] = useState('Собираем профиль Night Mode...');
  const [showDebugAuth, setShowDebugAuth] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    setShowDebugAuth(isLocal || params.get('debugAuth') === '1');
  }, []);

  useEffect(() => {
    let active = true;

    async function ensureTelegramSession() {
      try {
        return await fetchCurrentUser();
      } catch {
        const initData = await waitForTelegramInitData(1800, 120);
        if (!initData) {
          throw new Error('telegram-init-data-missing');
        }

        await loginWithTelegram({ initData });
        return fetchCurrentUser();
      }
    }

    async function loadProfile() {
      const fallbackUid = getStoredApiUid();

      try {
        const [currentUser, locationsResponse] = await Promise.allSettled([
          ensureTelegramSession(),
          fetch(apiUrl('/api/locations'))
        ]);

        if (!active) return;

        const resolvedUser = currentUser.status === 'fulfilled' ? currentUser.value : null;
        const locationsData =
          locationsResponse.status === 'fulfilled' && locationsResponse.value.ok
            ? ((await locationsResponse.value.json()) as { locations?: LocationApi[] })
            : null;

        const uid = resolvedUser?.id || fallbackUid;
        const allLocations = (locationsData?.locations || []).map(fromApiLocation);
        const ownLocations = allLocations
          .filter((item) => item.uid === uid)
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

        setProfile({
          uid,
          name:
            [resolvedUser?.first_name, resolvedUser?.last_name].filter(Boolean).join(' ').trim() ||
            resolvedUser?.username ||
            ownLocations[0]?.name ||
            uid,
          photo: resolvedUser?.photo_url || undefined,
          city: ownLocations[0]?.city || 'Unknown city',
          country: ownLocations[0]?.country || 'Unknown country',
          socials: {}
        });
        setLocations(ownLocations);
        setStatus(
          resolvedUser
            ? 'Профиль синхронизирован с Night Mode. Если хочешь больше персонализации, отметь свой город на карте.'
            : 'Открой профиль внутри Telegram Mini App, и аккаунт подтянется автоматически.'
        );
      } catch (error) {
        if (!active) return;
        setProfile(buildProfile(fallbackUid, []));
        setLocations([]);
        setStatus(
          error instanceof Error && error.message === 'telegram-init-data-missing'
            ? 'Открой этот экран из Telegram Mini App, чтобы Night Mode подтянул твой профиль автоматически.'
            : 'Профиль временно работает в офлайн-режиме. Повтори вход чуть позже.'
        );
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
      {showDebugAuth ? <AuthSessionPanel /> : null}

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
          <p className="mt-3 text-sm text-white/60">
            Пока здесь пусто. Отметь свой город на карте Night Mode, и он появится в профиле.
          </p>
        )}
      </section>

      <ItemsGrid items={[]} />
    </div>
  );
}
