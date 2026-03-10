'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import NmLogoMark from '@/components/ui/NmLogoMark';

type Props = {
  locale: Locale;
};

type FloatingBonus = {
  id: number;
  left: string;
  value: string;
};

type DemoState = {
  points: number;
  taps: number;
  combo: number;
  bestCombo: number;
  bonusBank: number;
  boostLevel: number;
};

const DEMO_TAP_LIMIT = 36;
const STORAGE_KEY = 'nm_clicker_demo_v2';

const copy: Record<
  Locale,
  {
    kicker: string;
    title: string;
    description: string;
    score: string;
    combo: string;
    left: string;
    bonusBank: string;
    tap: string;
    bonus: string;
    reset: string;
    openTelegram: string;
    fullGame: string;
    footer: string;
    limited: string;
    emptyBonus: string;
    resetStatus: string;
    bonusStatus: string;
    tapStatus: string;
    noteLabel: string;
    statusLabel: string;
    boostLabel: string;
    levelNames: string[];
  }
> = {
  ru: {
    kicker: 'демо режим',
    title: 'Кликер челлендж',
    description: 'Покликай немного, слови бонусы и переходи в Telegram за полной механикой.',
    score: 'Очки',
    combo: 'Комбо',
    left: 'Тапов осталось',
    bonusBank: 'Бонус банк',
    tap: 'Тапнуть',
    bonus: 'Забрать бонус',
    reset: 'Сбросить демо',
    openTelegram: 'Перейти в Telegram',
    fullGame: 'Полный кликер живет внутри Telegram app и не должен забирать аудиторию с сайта.',
    footer: 'Разомни свои пальчики и получай призы.',
    limited: 'Демо лимит закончился. Дальше переходи в Telegram.',
    emptyBonus: 'Сначала набери серию и открой бонус банк.',
    resetStatus: 'Демо прогресс сброшен. Можно снова разогнать пальцы.',
    bonusStatus: 'Бонус активирован. В Telegram откроется полный режим.',
    tapStatus: 'Серия растет. Еще немного и откроется жирный бонус.',
    noteLabel: 'telegram funnel',
    statusLabel: 'статус',
    boostLabel: 'ускорение',
    levelNames: ['Старт', 'Разогрев', 'Разнос', 'Ночной режим']
  },
  en: {
    kicker: 'demo mode',
    title: 'Clicker challenge',
    description: 'Tap a little, collect bonuses, then move to Telegram for the full game.',
    score: 'Score',
    combo: 'Combo',
    left: 'Taps left',
    bonusBank: 'Bonus bank',
    tap: 'Tap',
    bonus: 'Claim bonus',
    reset: 'Reset demo',
    openTelegram: 'Open Telegram',
    fullGame: 'The full clicker belongs inside the Telegram app so the site stays a lightweight funnel.',
    footer: 'Warm up your fingers and grab rewards.',
    limited: 'Demo limit reached. Continue in Telegram.',
    emptyBonus: 'Build a streak first to unlock the bonus bank.',
    resetStatus: 'Demo progress reset. You can run it again.',
    bonusStatus: 'Bonus claimed. Telegram opens the full version.',
    tapStatus: 'Streak is growing. A bigger bonus is close.',
    noteLabel: 'telegram funnel',
    statusLabel: 'status',
    boostLabel: 'boost',
    levelNames: ['Start', 'Warmup', 'Rush', 'Night mode']
  },
  am: {
    kicker: 'demo mode',
    title: 'Clicker challenge',
    description: 'Մի քիչ tap արա, վերցրու բոնուսները ու հետո անցիր Telegram:',
    score: 'Միավորներ',
    combo: 'Կոմբո',
    left: 'Մնացած tap-եր',
    bonusBank: 'Բոնուս բանկ',
    tap: 'Tap',
    bonus: 'Վերցնել բոնուսը',
    reset: 'Սկսել նորից',
    openTelegram: 'Բացել Telegram',
    fullGame: 'Ամբողջական clicker-ը պետք է մնա Telegram app-ի ներսում, իսկ կայքը լինի արագ մուտք:',
    footer: 'Տաքացրու մատերդ ու վերցրու մրցանակները:',
    limited: 'Demo limit-ը վերջացավ. անցիր Telegram:',
    emptyBonus: 'Սկզբում հավաքիր սերիա, որ bonus bank-ը բացվի:',
    resetStatus: 'Demo progress-ը մաքրվեց. կարող ես նորից սկսել:',
    bonusStatus: 'Բոնուսը վերցված է. ամբողջ ռեժիմը Telegram-ում է:',
    tapStatus: 'Սերիան աճում է. մեծ բոնուսը մոտ է:',
    noteLabel: 'telegram funnel',
    statusLabel: 'status',
    boostLabel: 'boost',
    levelNames: ['Սկիզբ', 'Տաքացում', 'Ռիթմ', 'Night mode']
  },
  kk: {
    kicker: 'demo mode',
    title: 'Кликер челлендж',
    description: 'Аздап шертіп көр, бонус жина да, толық нұсқа үшін Telegram-ға өт.',
    score: 'Ұпай',
    combo: 'Комбо',
    left: 'Қалған tap',
    bonusBank: 'Бонус банк',
    tap: 'Тап',
    bonus: 'Бонусты алу',
    reset: 'Демоны тазалау',
    openTelegram: 'Telegram ашу',
    fullGame: 'Толық кликер Telegram app ішінде қалады, ал сайт тек жылдам кіру нүктесі болады.',
    footer: 'Саусақтарыңды қыздыр да, сыйлықтарды ал.',
    limited: 'Демо лимит бітті. Әрі қарай Telegram-ға өт.',
    emptyBonus: 'Алдымен серия жинап, бонус банкті аш.',
    resetStatus: 'Демо прогресс тазаланды. Қайта бастауға болады.',
    bonusStatus: 'Бонус алынды. Толық нұсқа Telegram ішінде.',
    tapStatus: 'Серия өсіп жатыр. Үлкен бонус жақын.',
    noteLabel: 'telegram funnel',
    statusLabel: 'status',
    boostLabel: 'boost',
    levelNames: ['Бастау', 'Қызу', 'Қарқын', 'Night mode']
  }
};

function getTelegramUrl() {
  const username = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'nightmode').replace(/^@/, '').trim();
  return `https://t.me/${username}?startapp=clicker_demo`;
}

function getInitialState(): DemoState {
  return {
    points: 0,
    taps: 0,
    combo: 0,
    bestCombo: 0,
    bonusBank: 0,
    boostLevel: 0
  };
}

export default function NmClickerMiniApp({ locale }: Props) {
  const t = copy[locale];
  const [demo, setDemo] = useState<DemoState>(getInitialState);
  const [floatingBonuses, setFloatingBonuses] = useState<FloatingBonus[]>([]);
  const [statusText, setStatusText] = useState<string>(t.tapStatus);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as DemoState;
      setDemo({
        points: parsed.points || 0,
        taps: parsed.taps || 0,
        combo: parsed.combo || 0,
        bestCombo: parsed.bestCombo || 0,
        bonusBank: parsed.bonusBank || 0,
        boostLevel: parsed.boostLevel || 0
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
  }, [demo]);

  useEffect(() => {
    setStatusText(copy[locale].tapStatus);
  }, [locale]);

  const pointsToLevel = [0, 180, 420, 900];
  let levelIndex = 0;
  if (demo.points >= pointsToLevel[3]) levelIndex = 3;
  else if (demo.points >= pointsToLevel[2]) levelIndex = 2;
  else if (demo.points >= pointsToLevel[1]) levelIndex = 1;

  const remainingTaps = Math.max(0, DEMO_TAP_LIMIT - demo.taps);
  const currentLevel = t.levelNames[levelIndex];

  const spawnBonus = (value: string) => {
    const id = Date.now() + Math.round(Math.random() * 1000);
    const bonus: FloatingBonus = {
      id,
      left: `${22 + Math.random() * 56}%`,
      value
    };

    setFloatingBonuses((current) => [...current, bonus]);
    window.setTimeout(() => {
      setFloatingBonuses((current) => current.filter((item) => item.id !== id));
    }, 900);
  };

  const openTelegram = () => {
    const url = getTelegramUrl();
    const tg = (window as unknown as { Telegram?: { WebApp?: { openTelegramLink?: (value: string) => void } } }).Telegram;
    if (tg?.WebApp?.openTelegramLink) {
      tg.WebApp.openTelegramLink(url);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTap = () => {
    let gain = 0;
    let unlockedBonus = false;

    setDemo((current) => {
      const left = DEMO_TAP_LIMIT - current.taps;
      if (left <= 0) {
        return current;
      }

      gain = 18 + current.boostLevel * 10 + Math.min(24, current.combo * 2);
      const nextTaps = current.taps + 1;
      const nextCombo = current.combo + 1;
      unlockedBonus = nextTaps % 6 === 0;

      return {
        ...current,
        points: current.points + gain,
        taps: nextTaps,
        combo: nextCombo,
        bestCombo: Math.max(current.bestCombo, nextCombo),
        bonusBank: unlockedBonus ? current.bonusBank + 1 : current.bonusBank
      };
    });

    if (gain <= 0) {
      setStatusText(t.limited);
      return;
    }

    setIsPressed(true);
    window.setTimeout(() => setIsPressed(false), 130);
    spawnBonus(`+${gain}`);
    setStatusText(unlockedBonus ? `${t.tapStatus} +1 bonus.` : t.tapStatus);
  };

  const handleClaimBonus = () => {
    if (demo.bonusBank <= 0) {
      setStatusText(t.emptyBonus);
      return;
    }

    const reward = demo.bonusBank * 120 + demo.bestCombo * 8;
    setDemo((current) => ({
      ...current,
      points: current.points + reward,
      combo: 0,
      bonusBank: 0,
      boostLevel: Math.min(current.boostLevel + 1, 3)
    }));
    spawnBonus(`+${reward}`);
    setStatusText(t.bonusStatus);
  };

  const handleReset = () => {
    setDemo(getInitialState());
    setStatusText(t.resetStatus);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <section className="nm-line-panel nm-card relative overflow-hidden rounded-[2rem] p-5 md:p-7">
      <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(230,196,89,0.14),transparent_60%)]" />

      <div className="relative space-y-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-gold-400">{t.kicker}</p>
            <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-white">{t.title}</h2>
            <p className="text-sm leading-7 text-white/68">{t.description}</p>
          </div>
          <div className="nm-card rounded-[1.6rem] px-5 py-4 text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.score}</p>
            <p className="mt-2 text-4xl font-black text-gold-400">{demo.points}</p>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/55">{currentLevel}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="nm-card relative overflow-hidden rounded-[1.8rem] p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.3rem] border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">{t.combo}</p>
                <p className="mt-3 text-3xl font-black text-white">{demo.combo}</p>
              </div>
              <div className="rounded-[1.3rem] border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">{t.left}</p>
                <p className="mt-3 text-3xl font-black text-white">{remainingTaps}</p>
              </div>
              <div className="rounded-[1.3rem] border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">{t.bonusBank}</p>
                <p className="mt-3 text-3xl font-black text-gold-400">{demo.bonusBank}</p>
              </div>
            </div>

            <div className="relative mt-6 flex min-h-[320px] items-center justify-center overflow-hidden rounded-[1.8rem] border border-white/8 bg-black/25">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,196,89,0.12),transparent_50%)]" />
              {floatingBonuses.map((bonus) => (
                <span
                  key={bonus.id}
                  className="nm-floating-bonus pointer-events-none absolute top-1/2 text-xl font-black text-gold-400"
                  style={{ left: bonus.left }}
                >
                  {bonus.value}
                </span>
              ))}
              <button
                type="button"
                onClick={handleTap}
                className={`relative rounded-[2rem] border border-gold-500/30 bg-black/50 p-6 transition duration-150 active:scale-95 ${
                  isPressed ? 'scale-95 shadow-[0_0_48px_rgba(230,196,89,0.18)]' : 'scale-100'
                }`}
              >
                <NmLogoMark
                  stacked
                  className="items-center text-center"
                  monoClassName="h-28 w-[11rem] rounded-[2rem]"
                />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <button type="button" onClick={handleTap} className="nm-action rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em]">
                {t.tap}
              </button>
              <button type="button" onClick={handleClaimBonus} className="nm-pill rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-400">
                {t.bonus}
              </button>
              <button type="button" onClick={handleReset} className="nm-pill rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/80">
                {t.reset}
              </button>
              <button type="button" onClick={openTelegram} className="nm-pill rounded-full border-gold-500/25 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-400">
                {t.openTelegram}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="nm-card rounded-[1.8rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.noteLabel}</p>
              <p className="mt-3 text-sm leading-7 text-white/65">{t.fullGame}</p>
              <p className="mt-4 text-sm leading-7 text-white/65">{t.footer}</p>
            </div>
            <div className="nm-card rounded-[1.8rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.statusLabel}</p>
              <p className="mt-3 text-sm leading-7 text-gold-400">{statusText}</p>
            </div>
            <div className="nm-card rounded-[1.8rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.boostLabel}</p>
              <p className="mt-3 text-3xl font-black text-white">x{demo.boostLevel + 1}</p>
              <p className="mt-2 text-sm leading-7 text-white/58">
                {remainingTaps > 0 ? `${t.left}: ${remainingTaps}` : t.limited}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
