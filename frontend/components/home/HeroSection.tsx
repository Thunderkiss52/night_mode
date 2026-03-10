import NmLogoMark from '@/components/ui/NmLogoMark';

type Props = {
  title: string;
  subtitle: string;
  cta: string;
  locale: string;
};

export default function HeroSection({ title, subtitle, cta, locale }: Props) {
  return (
    <section className="nm-line-panel relative overflow-hidden rounded-[2rem] border border-white/10 p-7 sm:p-10">
      <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_60%)] md:block" />
      <div className="absolute -right-10 top-10 hidden opacity-60 md:block">
        <NmLogoMark
          stacked
          className="scale-[1.35] blur-[1px]"
          monoClassName="h-24 w-[10rem] rounded-[1.7rem]"
        />
      </div>
      <div className="relative z-10 max-w-3xl space-y-5">
        <NmLogoMark monoClassName="h-16 w-[6rem] rounded-[1.4rem]" />
        <h1 className="max-w-2xl text-4xl font-black uppercase leading-tight sm:text-5xl">{title}</h1>
        <p className="max-w-xl text-sm text-white/72 sm:text-base">{subtitle}</p>
        <a
          href={`/${locale}/profile`}
          className="nm-action inline-flex rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em]"
        >
          {cta}
        </a>
      </div>
    </section>
  );
}
