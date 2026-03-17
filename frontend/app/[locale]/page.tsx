import HeroSection from '@/components/home/HeroSection';
import MapClient from '@/components/map/MapClient';
import NmLogoMark from '@/components/ui/NmLogoMark';
import { getMessages, isLocale } from '@/lib/i18n';
import { notFound } from 'next/navigation';

export default async function HomePage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getMessages(locale);

  return (
    <div className="space-y-8">
      <HeroSection title={t.home.title} subtitle={t.home.subtitle} cta={t.home.cta} locale={locale} />

      <section className="grid gap-4 md:grid-cols-3">
        {t.home.tiles.map((tile: { title: string; text: string }) => (
          <div key={tile.title} className="nm-card relative overflow-hidden rounded-[1.7rem] p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(230,196,89,0.08),transparent_35%)]" />
            <div className="relative flex h-52 flex-col justify-between">
              <NmLogoMark
                className="opacity-95"
                monoClassName="h-12 w-[5.2rem] rounded-xl"
              />
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-[0.2em] text-white">{tile.title}</h3>
                <p className="text-sm leading-6 text-white/65">{tile.text}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-gold-400">{t.home.mapTitle}</h2>
        <MapClient initialMarkers={[]} locale={locale} />
      </section>
    </div>
  );
}
