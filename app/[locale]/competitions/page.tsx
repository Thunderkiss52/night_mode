import CityRankingClient from '@/components/competitions/CityRankingClient';
import { getMessages, isLocale } from '@/lib/i18n';
import { notFound } from 'next/navigation';

export default async function CompetitionsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const t = await getMessages(params.locale);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-gold-400">{t.competitions.title}</h1>
      <p className="text-zinc-300">{t.competitions.subtitle}</p>
      <h2 className="text-2xl font-bold text-gold-400">Рейтинг кликеров</h2>
      <CityRankingClient />
      {/* <ClickerGame uid="demo-user-1" /> */}
    </div>
  );
}
