export const locales = ['ru', 'en', 'am', 'kk'] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export async function getMessages(locale: Locale) {
  switch (locale) {
    case 'en':
      return (await import('@/messages/en.json')).default;
    case 'am':
      return (await import('@/messages/am.json')).default;
    case 'kk':
      return (await import('@/messages/kk.json')).default;
    case 'ru':
    default:
      return (await import('@/messages/ru.json')).default;
  }
}
