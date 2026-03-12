import { getMessages, isLocale } from '@/lib/i18n';
import { notFound } from 'next/navigation';
import MapClient from '@/components/map/MapClient';

export default async function MapPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getMessages(locale);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black uppercase tracking-[0.22em] text-gold-400">{t.map.title}</h1>
      <p className="max-w-2xl text-white/72">{t.map.subtitle}</p>
      <MapClient initialMarkers={[]} />
    </div>
  );
}
