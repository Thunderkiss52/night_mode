import HeroSection from '@/components/home/HeroSection';
import MapClient from '@/components/map/MapClient';
import { demoLocations } from '@/lib/mock-data';
import { getMessages, isLocale } from '@/lib/i18n';
import { notFound } from 'next/navigation';

export default async function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const t = await getMessages(params.locale);

  return (
    <div className="space-y-8">
      <HeroSection title={t.home.title} subtitle={t.home.subtitle} cta={t.home.cta} locale={params.locale} />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'
        ].map((image) => (
          <div key={image} className="nm-card overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="Night Mode style" className="h-52 w-full object-cover" />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-gold-400">{t.home.mapTitle}</h2>
        <MapClient initialMarkers={demoLocations} />
      </section>
    </div>
  );
}
