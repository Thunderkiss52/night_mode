import type { Locale } from '@/lib/i18n';

export type SeedCity = {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
};

type MapPreset = {
  defaultCountry: string;
  defaultCity: string;
  seedCities: SeedCity[];
};

const globalCities: SeedCity[] = [
  { id: 'global-berlin', city: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
  { id: 'global-dubai', city: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708 },
  { id: 'global-istanbul', city: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784 },
  { id: 'global-new-york', city: 'New York', country: 'United States', lat: 40.7128, lng: -74.006 },
  { id: 'global-seoul', city: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.978 },
  { id: 'global-tokyo', city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 }
];

const presetByLocale: Record<Locale, MapPreset> = {
  ru: {
    defaultCountry: 'Russia',
    defaultCity: 'Moscow',
    seedCities: [
      { id: 'ru-moscow', city: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173 },
      { id: 'ru-saint-petersburg', city: 'Saint Petersburg', country: 'Russia', lat: 59.9343, lng: 30.3351 },
      { id: 'ru-kazan', city: 'Kazan', country: 'Russia', lat: 55.7961, lng: 49.1064 },
      { id: 'ru-sochi', city: 'Sochi', country: 'Russia', lat: 43.5855, lng: 39.7231 },
      { id: 'ru-yekaterinburg', city: 'Yekaterinburg', country: 'Russia', lat: 56.8389, lng: 60.6057 },
      { id: 'ru-novosibirsk', city: 'Novosibirsk', country: 'Russia', lat: 55.0084, lng: 82.9357 }
    ]
  },
  en: {
    defaultCountry: 'United Kingdom',
    defaultCity: 'London',
    seedCities: [
      { id: 'en-london', city: 'London', country: 'United Kingdom', lat: 51.5072, lng: -0.1276 },
      { id: 'en-manchester', city: 'Manchester', country: 'United Kingdom', lat: 53.4808, lng: -2.2426 },
      { id: 'en-edinburgh', city: 'Edinburgh', country: 'United Kingdom', lat: 55.9533, lng: -3.1883 },
      { id: 'en-birmingham', city: 'Birmingham', country: 'United Kingdom', lat: 52.4862, lng: -1.8904 },
      { id: 'en-liverpool', city: 'Liverpool', country: 'United Kingdom', lat: 53.4084, lng: -2.9916 }
    ]
  },
  am: {
    defaultCountry: 'Armenia',
    defaultCity: 'Yerevan',
    seedCities: [
      { id: 'am-yerevan', city: 'Yerevan', country: 'Armenia', lat: 40.1792, lng: 44.4991 },
      { id: 'am-gyumri', city: 'Gyumri', country: 'Armenia', lat: 40.7894, lng: 43.8475 },
      { id: 'am-vanadzor', city: 'Vanadzor', country: 'Armenia', lat: 40.8128, lng: 44.4883 },
      { id: 'am-dilijan', city: 'Dilijan', country: 'Armenia', lat: 40.741, lng: 44.85 }
    ]
  },
  kk: {
    defaultCountry: 'Kazakhstan',
    defaultCity: 'Astana',
    seedCities: [
      { id: 'kk-astana', city: 'Astana', country: 'Kazakhstan', lat: 51.1694, lng: 71.4491 },
      { id: 'kk-almaty', city: 'Almaty', country: 'Kazakhstan', lat: 43.2389, lng: 76.8897 },
      { id: 'kk-shymkent', city: 'Shymkent', country: 'Kazakhstan', lat: 42.3417, lng: 69.5901 },
      { id: 'kk-karaganda', city: 'Karaganda', country: 'Kazakhstan', lat: 49.806, lng: 73.085 },
      { id: 'kk-atyrau', city: 'Atyrau', country: 'Kazakhstan', lat: 47.0945, lng: 51.9238 }
    ]
  }
};

export function getLocaleMapPreset(locale: Locale): MapPreset {
  const preset = presetByLocale[locale];
  const unique = new Map<string, SeedCity>();

  for (const city of [...preset.seedCities, ...globalCities]) {
    unique.set(`${city.country}::${city.city}`, city);
  }

  return {
    ...preset,
    seedCities: Array.from(unique.values())
  };
}
