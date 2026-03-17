'use client';

import { useEffect, useMemo, useState } from 'react';
import WorldMap from '@/components/map/WorldMap';
import { apiUrl } from '@/lib/api';
import { authHeaders, getStoredApiUid } from '@/lib/auth-client';
import type { Locale } from '@/lib/i18n';
import { getLocaleMapPreset, type SeedCity } from '@/lib/map-seed';
import type { CityMapMarker, UserLocation } from '@/lib/types';

type Props = {
  initialMarkers: UserLocation[];
  myUid?: string;
  locale: Locale;
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

const copy: Record<
  Locale,
  {
    cityCount: string;
    profileCount: string;
    yourCities: string;
    saving: string;
    cityView: string;
    cityViewHint: string;
    chooseCity: string;
    noMembers: string;
    noMembersHint: string;
    noLocations: string;
    saveFailed: string;
    reverseFailed: string;
    saved: (city: string, country: string) => string;
    dateLocale: string;
  }
> = {
  ru: {
    cityCount: 'Городов на карте',
    profileCount: 'Профилей на карте',
    yourCities: 'Ваших городов',
    saving: 'Определяем город и сохраняем локацию...',
    cityView: 'Вид профилей',
    cityViewHint: 'На карте показаны ключевые города Night Mode, а ниже открываются профили участников выбранного города.',
    chooseCity: 'Выберите город на карте',
    noMembers: 'Этот город уже готов принять Night Mode.',
    noMembersHint: 'Пока здесь никто не отметился. Будь первым, кто зажжёт эту точку на карте.',
    noLocations: 'Когда на карте появятся участники, здесь откроются профили выбранного города.',
    saveFailed: 'Не удалось сохранить локацию.',
    reverseFailed: 'Не удалось определить город.',
    saved: (city, country) => `Точка добавлена: ${city}, ${country}`,
    dateLocale: 'ru-RU'
  },
  en: {
    cityCount: 'Cities on map',
    profileCount: 'Profiles on map',
    yourCities: 'Your cities',
    saving: 'Resolving city and saving location...',
    cityView: 'Profile view',
    cityViewHint: 'The map highlights key Night Mode cities, and the profiles below open for the selected city.',
    chooseCity: 'Choose a city on the map',
    noMembers: 'This city is ready for the Night Mode wave.',
    noMembersHint: 'No one has checked in here yet. Be the first one to light it up.',
    noLocations: 'Profiles for the selected city will appear here when members start marking points.',
    saveFailed: 'Failed to save location.',
    reverseFailed: 'Failed to resolve city.',
    saved: (city, country) => `Point added: ${city}, ${country}`,
    dateLocale: 'en-US'
  },
  am: {
    cityCount: 'Քաղաքներ քարտեզում',
    profileCount: 'Պրոֆիլներ քարտեզում',
    yourCities: 'Քո քաղաքները',
    saving: 'Քաղաքը որոշվում է և լոկացիան պահվում է...',
    cityView: 'Պրոֆիլների տեսք',
    cityViewHint: 'Քարտեզում երևում են Night Mode-ի գլխավոր քաղաքները, իսկ ներքևում բացվում են ընտրված քաղաքի մասնակիցները:',
    chooseCity: 'Ընտրիր քաղաք քարտեզի վրա',
    noMembers: 'Այս քաղաքը պատրաստ է Night Mode-ի համար:',
    noMembersHint: 'Այստեղ դեռ ոչ ոք չի նշվել: Եղիր առաջինը:',
    noLocations: 'Պրոֆիլները կհայտնվեն այստեղ, երբ քարտեզի վրա հայտնվեն մասնակիցներ:',
    saveFailed: 'Չհաջողվեց պահպանել լոկացիան:',
    reverseFailed: 'Չհաջողվեց որոշել քաղաքը:',
    saved: (city, country) => `Կետը ավելացվեց. ${city}, ${country}`,
    dateLocale: 'hy-AM'
  },
  kk: {
    cityCount: 'Картадағы қалалар',
    profileCount: 'Картадағы профильдер',
    yourCities: 'Сіздің қалаларыңыз',
    saving: 'Қала анықталып, локация сақталып жатыр...',
    cityView: 'Профиль көрінісі',
    cityViewHint: 'Картада Night Mode-тың негізгі қалалары көрсетіледі, ал төменде таңдалған қаланың адамдары ашылады.',
    chooseCity: 'Картадан қаланы таңдаңыз',
    noMembers: 'Бұл қала Night Mode толқынын күтіп тұр.',
    noMembersHint: 'Мұнда әзірге ешкім белгі қалдырмаған. Алғашқысы бол.',
    noLocations: 'Қатысушылар пайда болғанда, осы жерде таңдалған қаланың профильдері көрсетіледі.',
    saveFailed: 'Локацияны сақтау мүмкін болмады.',
    reverseFailed: 'Қаланы анықтау мүмкін болмады.',
    saved: (city, country) => `Нүкте қосылды: ${city}, ${country}`,
    dateLocale: 'kk-KZ'
  }
};

function buildCityMarkers(locations: UserLocation[], seedCities: SeedCity[]): CityMapMarker[] {
  const grouped = new Map<string, { seed?: SeedCity; members: UserLocation[] }>();

  for (const city of seedCities) {
    grouped.set(`${city.country}::${city.city}`, { seed: city, members: [] });
  }

  for (const location of locations) {
    const key = `${location.country}::${location.city}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.members.push(location);
    } else {
      grouped.set(key, { members: [location] });
    }
  }

  return Array.from(grouped.entries())
    .map(([key, entry]) => {
      const sortedMembers = [...entry.members].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      const lat =
        sortedMembers.length > 0
          ? sortedMembers.reduce((sum, member) => sum + member.lat, 0) / sortedMembers.length
          : (entry.seed?.lat ?? 0);
      const lng =
        sortedMembers.length > 0
          ? sortedMembers.reduce((sum, member) => sum + member.lng, 0) / sortedMembers.length
          : (entry.seed?.lng ?? 0);
      const fallbackCity = entry.seed?.city || sortedMembers[0]?.city || 'Unknown city';
      const fallbackCountry = entry.seed?.country || sortedMembers[0]?.country || 'Unknown country';

      return {
        id: key,
        city: fallbackCity,
        country: fallbackCountry,
        lat,
        lng,
        members: sortedMembers
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

export default function MapClient({ initialMarkers, myUid = 'demo-user-1', locale }: Props) {
  const t = copy[locale];
  const preset = useMemo(() => getLocaleMapPreset(locale), [locale]);
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
        // Keep seed cities visible when API is unavailable.
      }
    }

    loadLocations();

    return () => {
      active = false;
    };
  }, []);

  const cityMarkers = useMemo(() => buildCityMarkers(markers, preset.seedCities), [markers, preset.seedCities]);
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
      const preferred = cityMarkers.find(
        (marker) => marker.country === preset.defaultCountry && marker.city === preset.defaultCity
      );
      setSelectedCityId(preferred?.id || cityMarkers[0].id);
    }
  }, [cityMarkers, preset.defaultCity, preset.defaultCountry, selectedCityId]);

  const onAddPoint = async (lat: number, lng: number) => {
    const uid = getStoredApiUid(actorUid);
    setSaveStatus(t.saving);

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
        setSaveStatus(t.saveFailed);
        return;
      }
      const data = (await response.json()) as { location?: LocationApi };
      if (!data.location) {
        setSaveStatus(t.reverseFailed);
        return;
      }

      const persisted = fromApiLocation(data.location);
      setMarkers((prev) => [persisted, ...prev]);
      setSelectedCityId(`${persisted.country}::${persisted.city}`);
      setSaveStatus(t.saved(persisted.city, persisted.country));
    } catch {
      setSaveStatus(t.saveFailed);
    }
  };

  return (
    <div className="space-y-4">
      <div className="nm-card rounded-[1.6rem] p-4 text-sm">
        <p className="uppercase tracking-[0.2em] text-gold-400">{t.cityCount}: {cityMarkers.length}</p>
        <p className="mt-2 uppercase tracking-[0.2em] text-white/72">{t.profileCount}: {markers.length}</p>
        <p className="mt-2 uppercase tracking-[0.2em] text-white/72">{t.yourCities}: {ownCityCount}</p>
        {saveStatus ? <p className="mt-3 text-xs text-gold-300">{saveStatus}</p> : null}
      </div>
      <WorldMap
        locale={locale}
        markers={cityMarkers}
        selectedCityId={selectedCityId}
        onSelectCity={setSelectedCityId}
        onAddPoint={onAddPoint}
        defaultCountry={preset.defaultCountry}
        defaultCity={preset.defaultCity}
      />
      <section className="nm-card rounded-[1.8rem] p-5">
        <div className="flex flex-col gap-3 border-b border-white/8 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold-400">{t.cityView}</p>
            <h3 className="mt-2 text-2xl font-black text-white">
              {selectedCity ? `${selectedCity.city}, ${selectedCity.country}` : t.chooseCity}
            </h3>
          </div>
          <p className="max-w-md text-sm text-white/60">{t.cityViewHint}</p>
        </div>

        {selectedCity && selectedCity.members.length > 0 ? (
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
                  <span>{new Date(member.createdAt).toLocaleDateString(t.dateLocale)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : selectedCity ? (
          <div className="mt-5 rounded-[1.6rem] border border-dashed border-gold-500/20 bg-gold-500/6 px-5 py-6">
            <p className="text-lg font-semibold text-white">{t.noMembers}</p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/62">{t.noMembersHint}</p>
          </div>
        ) : (
          <p className="mt-5 text-sm text-white/60">{t.noLocations}</p>
        )}
      </section>
    </div>
  );
}
