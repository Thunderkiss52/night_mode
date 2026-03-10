import { notFound } from 'next/navigation';
import { getMessages, isLocale } from '@/lib/i18n';
import QrScanner from '@/components/qr/QrScanner';
import QrBindPanel from '@/components/qr/QrBindPanel';
import { QRCodeSVG } from 'qrcode.react';

export default async function QrPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const t = await getMessages(params.locale);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-gold-400">{t.qr.title}</h1>
      <p className="text-zinc-300">{t.qr.subtitle}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <QrScanner />
        <QrBindPanel />
      </div>

      <section className="nm-card rounded-2xl p-5">
        <h3 className="text-xl font-bold text-gold-400">Пример QR для печати на одежде</h3>
        <div className="mt-4 inline-flex rounded-lg bg-white p-3">
          <QRCodeSVG value="NM-HOODIE-1234" size={180} />
        </div>
      </section>
    </div>
  );
}
