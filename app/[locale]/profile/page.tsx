import ClickerGame from '@/components/competitions/ClickerGame';
import AuthSessionPanel from '@/components/profile/AuthSessionPanel';
import ItemsGrid from '@/components/profile/ItemsGrid';
import ProfileCard from '@/components/profile/ProfileCard';
import { demoItems, demoLocations, demoProfile } from '@/lib/mock-data';
import { getMessages, isLocale } from '@/lib/i18n';
import { notFound } from 'next/navigation';

export default async function ProfilePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const t = await getMessages(params.locale);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-gold-400">{t.profile.title}</h1>
      <ProfileCard profile={demoProfile} />
      <AuthSessionPanel />

      <section className="nm-card rounded-2xl p-5">
        <h3 className="text-xl font-bold text-gold-400">Мои точки</h3>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {demoLocations.map((point) => (
            <p key={point.id} className="rounded border border-gold-500/20 bg-black/40 px-3 py-2">
              {point.city}, {point.country} ({point.lat.toFixed(2)}, {point.lng.toFixed(2)})
            </p>
          ))}
        </div>
      </section>

      <ItemsGrid items={demoItems} />
      <ClickerGame uid={demoProfile.uid} />
    </div>
  );
}
