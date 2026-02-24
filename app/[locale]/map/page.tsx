import { demoLocations } from '@/lib/mock-data';
import { getMessages, isLocale } from '@/lib/i18n';
import { notFound } from 'next/navigation';
import MapClient from '@/components/map/MapClient';

export default async function MapPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const t = await getMessages(params.locale);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-gold-400">{t.map.title}</h1>
      <p className="text-zinc-300">{t.map.subtitle}</p>
      <MapClient initialMarkers={demoLocations} />
    </div>
  );
}
