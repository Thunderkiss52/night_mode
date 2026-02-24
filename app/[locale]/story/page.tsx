import { notFound } from 'next/navigation';
import { getMessages, isLocale } from '@/lib/i18n';

export default async function StoryPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const t = await getMessages(params.locale);

  return (
    <article className="nm-card max-w-3xl rounded-2xl p-6">
      <h1 className="text-3xl font-black text-gold-400">{t.story.title}</h1>
      <p className="mt-4 text-zinc-300">{t.story.p1}</p>
      <p className="mt-3 text-zinc-300">{t.story.p2}</p>
      <p className="mt-3 text-zinc-300">{t.story.p3}</p>
    </article>
  );
}
