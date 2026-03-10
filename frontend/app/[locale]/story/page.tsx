import { notFound } from 'next/navigation';
import { getMessages, isLocale } from '@/lib/i18n';
import NmLogoMark from '@/components/ui/NmLogoMark';

export default async function StoryPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getMessages(locale);
  const story = t.story as {
    title: string;
    paragraphs?: string[];
    points?: string[];
    listTitle?: string;
    outro?: string;
    p1?: string;
    p2?: string;
    p3?: string;
  };
  const storyParagraphs = Array.isArray(story.paragraphs)
    ? story.paragraphs
    : [story.p1, story.p2, story.p3].filter((value): value is string => Boolean(value));
  const storyPoints = Array.isArray(story.points) ? story.points : [];

  return (
    <article className="nm-card relative max-w-4xl overflow-hidden rounded-[2rem] p-6 sm:p-8">
      <div className="absolute -right-8 top-8 opacity-10 blur-lg">
        <NmLogoMark
          stacked
          className="scale-[2.1]"
          monoClassName="h-24 w-[10rem] rounded-[1.8rem]"
        />
      </div>
      <div className="relative max-w-2xl">
        <h1 className="text-3xl font-black uppercase tracking-[0.22em] text-gold-400">{story.title}</h1>
        <div className="mt-4 space-y-3">
          {storyParagraphs.map((paragraph: string) => (
            <p key={paragraph} className="leading-7 text-white/72">
              {paragraph}
            </p>
          ))}
        </div>
        {storyPoints.length > 0 ? (
          <div className="mt-5 space-y-3">
            {story.listTitle ? (
              <p className="text-sm uppercase tracking-[0.22em] text-gold-400">{story.listTitle}</p>
            ) : null}
            <ul className="space-y-2 text-white/78">
              {storyPoints.map((point: string) => (
                <li key={point} className="leading-7">
                  • {point}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {story.outro ? <p className="mt-5 text-base font-semibold text-gold-400">{story.outro}</p> : null}
      </div>
    </article>
  );
}
