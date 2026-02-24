import Link from 'next/link';
import { Locale, locales } from '@/lib/i18n';

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
  return (
    <header className="sticky top-0 z-50 border-b border-gold-500/20 bg-black/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={`/${locale}`} className="text-lg font-extrabold tracking-wide text-gold-500">
          NIGHT MODE
        </Link>

        <div className="hidden gap-5 text-sm md:flex">
          <Link href={`/${locale}`}>{labels.home}</Link>
          <Link href={`/${locale}/story`}>{labels.story}</Link>
          <Link href={`/${locale}/map`}>{labels.map}</Link>
          <Link href={`/${locale}/profile`}>{labels.profile}</Link>
          <Link href={`/${locale}/competitions`}>{labels.competitions}</Link>
          <Link href={`/${locale}/qr`}>{labels.qr}</Link>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {locales.map((item) => (
            <Link
              key={item}
              href={`/${item}`}
              className={`rounded px-2 py-1 uppercase ${item === locale ? 'bg-gold-500 text-black' : 'border border-gold-500/40 text-gold-500'}`}
            >
              {item}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
