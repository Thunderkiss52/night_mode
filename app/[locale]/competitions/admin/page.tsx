import LotteryAdminClient from '@/components/competitions/LotteryAdminClient';
import { isLocale } from '@/lib/i18n';
import { notFound } from 'next/navigation';

export default function LotteryAdminPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-gold-400">NM Clicker Admin</h1>
      <p className="text-zinc-300">Ручной список участников розыгрыша.</p>
      <LotteryAdminClient />
    </div>
  );
}

