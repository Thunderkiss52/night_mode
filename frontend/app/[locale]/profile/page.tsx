import ProfileClient from '@/components/profile/ProfileClient';
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
      <ProfileClient />
    </div>
  );
}
