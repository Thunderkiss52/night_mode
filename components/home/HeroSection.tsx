type Props = {
  title: string;
  subtitle: string;
  cta: string;
  locale: string;
};

export default function HeroSection({ title, subtitle, cta, locale }: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-gold-500/20 p-7 sm:p-10">
      <div className="absolute inset-0 bg-gradient-to-br from-black to-night-800 opacity-95" />
      <div className="absolute -top-20 right-0 h-60 w-60 rounded-full bg-gold-500/15 blur-3xl" />
      <div className="relative z-10 max-w-2xl space-y-4">
        <p className="inline-flex rounded-full border border-gold-500/40 px-3 py-1 text-xs uppercase tracking-wide text-gold-400">
          Night community platform
        </p>
        <h1 className="text-4xl font-black leading-tight sm:text-5xl">{title}</h1>
        <p className="text-sm text-zinc-300 sm:text-base">{subtitle}</p>
        <a
          href={`/${locale}/profile`}
          className="inline-flex rounded bg-gold-500 px-5 py-2 font-semibold text-black transition hover:bg-gold-400"
        >
          {cta}
        </a>
      </div>
    </section>
  );
}
