import NmClickerMiniApp from '@/components/competitions/NmClickerMiniApp';
import { getMessages, isLocale } from '@/lib/i18n';
import { notFound } from 'next/navigation';

export default async function CompetitionsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getMessages(locale);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black uppercase tracking-[0.22em] text-gold-400">{t.competitions.title}</h1>
      <p className="max-w-3xl text-white/72">{t.competitions.subtitle}</p>
      <NmClickerMiniApp locale={locale} />
    </div>
  );
}
