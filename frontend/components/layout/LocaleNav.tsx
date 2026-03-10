import Link from 'next/link';
import { Locale, locales } from '@/lib/i18n';
import NmLogoMark from '@/components/ui/NmLogoMark';

type Props = {
  locale: Locale;
  labels: {
    home: string;
    map: string;
    profile: string;
    competitions: string;
    qr: string;
    story: string;
  };
};

export default function LocaleNav({ locale, labels }: Props) {
  const localeLabels: Record<Locale, string> = {
    ru: 'RU',
    en: 'EN',
    am: 'AM',
    kk: 'KZ'
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <Link href={`/${locale}`} className="inline-flex">
          <NmLogoMark
            monoClassName="h-11 w-[5rem] rounded-xl"
          />
        </Link>

        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-white/80 md:text-sm">
          <Link href={`/${locale}`} className="nm-pill rounded-full px-4 py-2">
            {labels.home}
          </Link>
          <Link href={`/${locale}/story`} className="nm-pill rounded-full px-4 py-2">
            {labels.story}
          </Link>
          <Link href={`/${locale}/map`} className="nm-pill rounded-full px-4 py-2">
            {labels.map}
          </Link>
          <Link href={`/${locale}/profile`} className="nm-pill rounded-full px-4 py-2">
            {labels.profile}
          </Link>
          <Link href={`/${locale}/competitions`} className="nm-pill rounded-full px-4 py-2">
            {labels.competitions}
          </Link>
          <Link href={`/${locale}/qr`} className="nm-pill rounded-full px-4 py-2">
            {labels.qr}
          </Link>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {locales.map((item) => (
            <Link
              key={item}
              href={`/${item}`}
              className={`rounded-full px-3 py-2 uppercase tracking-[0.22em] transition ${
                item === locale
                  ? 'nm-action font-semibold'
                  : 'nm-pill border-white/10 text-white/75'
              }`}
            >
              {localeLabels[item]}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
