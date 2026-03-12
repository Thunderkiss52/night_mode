'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { apiUrl } from '@/lib/api';
import NmLogoMark from '@/components/ui/NmLogoMark';

type Props = {
  locale: Locale;
};

type FloatingBonus = {
  id: number;
  left: string;
  value: string;
};

type ClickerState = {
  uid: string;
  telegram_user_id: number | null;
  username: string | null;
  display_name: string;
  points: number;
  level: number;
  multiplier: number;
  referrals: number;
  referred_by: number | null;
  daily_bonus_available: boolean;
  daily_bonus_claimed_at: string | null;
  next_daily_bonus_at: string | null;
  lottery_joined: boolean;
  lottery_entered_at: string | null;
  night_mode_unlocked: boolean;
  taps_in_current_second: number;
  level_start_points: number;
  next_level_points: number | null;
  updated_at: string;
};

type ClickerAuthResponse = {
  access_token: string;
  uid: string;
  start_param?: string | null;
  state: ClickerState;
};

type ClickerTapResponse = {
  ok: boolean;
  added_points: number;
  message: string;
  state: ClickerState;
};

type ClickerStateResponse = {
  state: ClickerState;
};

type ClickerLeaderboardItem = {
  rank: number;
  uid: string;
  telegram_user_id: number | null;
  display_name: string;
  points: number;
  level: number;
  referrals: number;
  updated_at: string;
};

type ClickerLeaderboardResponse = {
  items?: ClickerLeaderboardItem[];
};

const CLICKER_TOKEN_KEY = 'nm_clicker_access_token';
const CLICKER_UID_KEY = 'nm_clicker_uid';
const CLICKER_DEV_TG_ID_KEY = 'nm_clicker_dev_tg_id';

const copy: Record<
  Locale,
  {
    kicker: string;
    title: string;
    description: string;
    points: string;
    level: string;
    multiplier: string;
    referrals: string;
    progress: string;
    dailyBonus: string;
    lottery: string;
    unlocked: string;
    locked: string;
    tap: string;
    reload: string;
    claimBonus: string;
    joinLottery: string;
    openTelegram: string;
    applyReferral: string;
    referralPlaceholder: string;
    leaderboard: string;
    connect: string;
    connectHint: string;
    statusLabel: string;
    playerLabel: string;
    noLeaderboard: string;
  }
> = {
  ru: {
    kicker: 'api режим',
    title: 'NM clicker',
    description: 'Этот экран теперь работает от backend API: авторизация, очки, daily bonus, referral, leaderboard и lottery.',
    points: 'Очки',
    level: 'Уровень',
    multiplier: 'Множитель',
    referrals: 'Рефералы',
    progress: 'Прогресс',
    dailyBonus: 'Daily bonus',
    lottery: 'Лотерея',
    unlocked: 'Открыто',
    locked: 'Закрыто',
    tap: 'Тапнуть',
    reload: 'Обновить',
    claimBonus: 'Забрать бонус',
    joinLottery: 'Войти в лотерею',
    openTelegram: 'Открыть Telegram',
    applyReferral: 'Применить реферал',
    referralPlaceholder: 'Telegram ID реферера',
    leaderboard: 'Лидерборд',
    connect: 'Подключить clicker API',
    connectHint: 'В Telegram используем `initData`, локально fallback на dev_telegram_user_id.',
    statusLabel: 'Статус',
    playerLabel: 'Игрок',
    noLeaderboard: 'Лидерборд пока пуст.'
  },
  en: {
    kicker: 'api mode',
    title: 'NM clicker',
    description: 'This screen now uses backend APIs for auth, points, daily bonus, referrals, leaderboard, and lottery.',
    points: 'Points',
    level: 'Level',
    multiplier: 'Multiplier',
    referrals: 'Referrals',
    progress: 'Progress',
    dailyBonus: 'Daily bonus',
    lottery: 'Lottery',
    unlocked: 'Unlocked',
    locked: 'Locked',
    tap: 'Tap',
    reload: 'Reload',
    claimBonus: 'Claim bonus',
    joinLottery: 'Join lottery',
    openTelegram: 'Open Telegram',
    applyReferral: 'Apply referral',
    referralPlaceholder: 'Referrer Telegram ID',
    leaderboard: 'Leaderboard',
    connect: 'Connect clicker API',
    connectHint: 'Telegram uses `initData`, local mode falls back to dev_telegram_user_id.',
    statusLabel: 'Status',
    playerLabel: 'Player',
    noLeaderboard: 'Leaderboard is empty for now.'
  },
  am: {
    kicker: 'api mode',
    title: 'NM clicker',
    description: 'Այս էկրանը հիմա աշխատում է backend API-ներով auth, points, daily bonus, referrals, leaderboard և lottery-ի համար:',
    points: 'Միավորներ',
    level: 'Մակարդակ',
    multiplier: 'Multiplier',
    referrals: 'Referrals',
    progress: 'Progress',
    dailyBonus: 'Daily bonus',
    lottery: 'Lottery',
    unlocked: 'Unlocked',
    locked: 'Locked',
    tap: 'Tap',
    reload: 'Reload',
    claimBonus: 'Claim bonus',
    joinLottery: 'Join lottery',
    openTelegram: 'Open Telegram',
    applyReferral: 'Apply referral',
    referralPlaceholder: 'Referrer Telegram ID',
    leaderboard: 'Leaderboard',
    connect: 'Connect clicker API',
    connectHint: 'Telegram-ում օգտագործվում է `initData`, local mode-ում `dev_telegram_user_id`:',
    statusLabel: 'Status',
    playerLabel: 'Player',
    noLeaderboard: 'Leaderboard-ը դեռ դատարկ է:'
  },
  kk: {
    kicker: 'api режим',
    title: 'NM clicker',
    description: 'Бұл экран енді backend API арқылы жұмыс істейді: auth, points, daily bonus, referral, leaderboard және lottery.',
    points: 'Ұпай',
    level: 'Деңгей',
    multiplier: 'Көбейткіш',
    referrals: 'Рефералдар',
    progress: 'Прогресс',
    dailyBonus: 'Daily bonus',
    lottery: 'Lottery',
    unlocked: 'Ашық',
    locked: 'Жабық',
    tap: 'Тап',
    reload: 'Жаңарту',
    claimBonus: 'Бонусты алу',
    joinLottery: 'Лотереяға кіру',
    openTelegram: 'Telegram ашу',
    applyReferral: 'Рефералды қолдану',
    referralPlaceholder: 'Реферер Telegram ID',
    leaderboard: 'Лидерборд',
    connect: 'Clicker API қосу',
    connectHint: 'Telegram ішінде `initData`, локалда `dev_telegram_user_id` қолданылады.',
    statusLabel: 'Статус',
    playerLabel: 'Ойыншы',
    noLeaderboard: 'Лидерборд әзірге бос.'
  }
};

function clickerHeaders(token: string | null, base: HeadersInit = {}): HeadersInit {
  if (!token) return base;
  return {
    ...base,
    Authorization: `Bearer ${token}`
  };
}

function getStoredClickerToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem(CLICKER_TOKEN_KEY);
  return token?.trim() || null;
}

function saveClickerSession(token: string, uid: string) {
  window.localStorage.setItem(CLICKER_TOKEN_KEY, token);
  window.localStorage.setItem(CLICKER_UID_KEY, uid);
}

function getTelegramUrl() {
  const username = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'nightmode').replace(/^@/, '').trim();
  return `https://t.me/${username}?startapp=clicker`;
}

function getTelegramInitData() {
  if (typeof window === 'undefined') return '';
  const tg = window as Window & {
    Telegram?: {
      WebApp?: {
        initData?: string;
        openTelegramLink?: (value: string) => void;
      };
    };
  };
  return tg.Telegram?.WebApp?.initData?.trim() || '';
}

function getOrCreateDevTelegramId() {
  const stored = window.localStorage.getItem(CLICKER_DEV_TG_ID_KEY);
  if (stored?.trim()) return Number(stored);

  const generated = Math.floor(Date.now() / 1000);
  window.localStorage.setItem(CLICKER_DEV_TG_ID_KEY, String(generated));
  return generated;
}

function formatCount(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) return '—';
  return new Date(value).toLocaleString(locale === 'ru' ? 'ru-RU' : locale);
}

export default function NmClickerMiniApp({ locale }: Props) {
  const t = copy[locale];
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<ClickerState | null>(null);
  const [leaderboard, setLeaderboard] = useState<ClickerLeaderboardItem[]>([]);
  const [statusText, setStatusText] = useState(t.connectHint);
  const [isBusy, setIsBusy] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [referrerId, setReferrerId] = useState('');
  const [floatingBonuses, setFloatingBonuses] = useState<FloatingBonus[]>([]);

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
    const tg = window as Window & {
      Telegram?: { WebApp?: { openTelegramLink?: (value: string) => void } };
    };

    if (tg.Telegram?.WebApp?.openTelegramLink) {
      tg.Telegram.WebApp.openTelegramLink(url);
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const loadLeaderboard = async (currentToken: string | null = token) => {
    try {
      const response = await fetch(apiUrl('/api/clicker/leaderboard?limit=8'), {
        headers: clickerHeaders(currentToken)
      });
      if (!response.ok) return;
      const data = (await response.json()) as ClickerLeaderboardResponse;
      setLeaderboard(Array.isArray(data.items) ? data.items : []);
    } catch {}
  };

  const connectClicker = async () => {
    setIsBusy(true);
    setStatusText(t.connectHint);

    try {
      const initData = getTelegramInitData();
      const payload = initData
        ? { init_data: initData }
        : {
            dev_telegram_user_id: getOrCreateDevTelegramId(),
            username: 'night_mode_web',
            first_name: 'Night',
            last_name: 'Mode'
          };

      const response = await fetch(apiUrl('/api/clicker/auth/telegram'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as ClickerAuthResponse | { detail?: string };

      if (!response.ok || !('access_token' in data)) {
        setStatusText(('detail' in data && data.detail) || 'Clicker auth failed');
        return;
      }

      saveClickerSession(data.access_token, data.uid);
      setToken(data.access_token);
      setState(data.state);
      setStatusText(`Clicker session ready: ${data.state.display_name}`);
      await loadLeaderboard(data.access_token);
    } catch {
      setStatusText('Clicker API недоступен.');
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    setStatusText(copy[locale].connectHint);
  }, [locale]);

  useEffect(() => {
    let active = true;

    async function restoreOrConnect() {
      const storedToken = getStoredClickerToken();
      if (!storedToken) {
        await connectClicker();
        return;
      }

      try {
        const response = await fetch(apiUrl('/api/clicker/state'), {
          headers: clickerHeaders(storedToken)
        });

        if (!response.ok) {
          await connectClicker();
          return;
        }

        const data = (await response.json()) as ClickerStateResponse;
        if (!active) return;

        setToken(storedToken);
        setState(data.state);
        setStatusText(`Clicker session restored: ${data.state.display_name}`);
        await loadLeaderboard(storedToken);
      } catch {
        await connectClicker();
      }
    }

    void restoreOrConnect();

    return () => {
      active = false;
    };
  }, [t.connectHint]);

  const refreshState = async () => {
    if (!token) return;

    setIsBusy(true);
    try {
      const response = await fetch(apiUrl('/api/clicker/state'), {
        headers: clickerHeaders(token)
      });
      const data = (await response.json()) as ClickerStateResponse | { detail?: string };
      if (!response.ok || !('state' in data)) {
        setStatusText(('detail' in data && data.detail) || 'State refresh failed');
        return;
      }
      setState(data.state);
      setStatusText(`State updated: ${data.state.display_name}`);
    } catch {
      setStatusText('Не удалось обновить clicker state.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleTap = async () => {
    if (!token) return;

    setIsBusy(true);
    setIsPressed(true);

    try {
      const response = await fetch(apiUrl('/api/clicker/tap'), {
        method: 'POST',
        headers: clickerHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ taps: 1 })
      });

      const data = (await response.json()) as ClickerTapResponse | { detail?: string };
      if (!response.ok || !('state' in data)) {
        setStatusText(('detail' in data && data.detail) || 'Tap failed');
        return;
      }

      setState(data.state);
      setStatusText(data.message);
      if (data.added_points > 0) {
        spawnBonus(`+${data.added_points}`);
      }
      await loadLeaderboard(token);
    } catch {
      setStatusText('Не удалось отправить tap.');
    } finally {
      window.setTimeout(() => setIsPressed(false), 130);
      setIsBusy(false);
    }
  };

  const handleDailyBonus = async () => {
    if (!token) return;

    setIsBusy(true);
    try {
      const response = await fetch(apiUrl('/api/clicker/daily-bonus'), {
        method: 'POST',
        headers: clickerHeaders(token)
      });
      const data = (await response.json()) as ClickerTapResponse | { detail?: string };
      if (!response.ok || !('state' in data)) {
        setStatusText(('detail' in data && data.detail) || 'Daily bonus failed');
        return;
      }

      setState(data.state);
      setStatusText(data.message);
      if (data.added_points > 0) {
        spawnBonus(`+${data.added_points}`);
      }
      await loadLeaderboard(token);
    } catch {
      setStatusText('Не удалось забрать daily bonus.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleLottery = async () => {
    if (!token) return;

    setIsBusy(true);
    try {
      const response = await fetch(apiUrl('/api/clicker/lottery/enter'), {
        method: 'POST',
        headers: clickerHeaders(token)
      });
      const data = (await response.json()) as ClickerTapResponse | { detail?: string };
      if (!response.ok || !('state' in data)) {
        setStatusText(('detail' in data && data.detail) || 'Lottery request failed');
        return;
      }

      setState(data.state);
      setStatusText(data.message);
    } catch {
      setStatusText('Не удалось войти в лотерею.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleReferral = async () => {
    if (!token || !referrerId.trim()) return;

    setIsBusy(true);
    try {
      const response = await fetch(apiUrl('/api/clicker/referral/apply'), {
        method: 'POST',
        headers: clickerHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ referrer_telegram_id: Number(referrerId) })
      });
      const data = (await response.json()) as ClickerTapResponse | { detail?: string };
      if (!response.ok || !('state' in data)) {
        setStatusText(('detail' in data && data.detail) || 'Referral apply failed');
        return;
      }

      setState(data.state);
      setStatusText(data.message);
      await loadLeaderboard(token);
    } catch {
      setStatusText('Не удалось применить referral.');
    } finally {
      setIsBusy(false);
    }
  };

  const progressValue = state
    ? state.next_level_points === null
      ? 'MAX'
      : `${Math.max(0, state.points - state.level_start_points)} / ${Math.max(0, state.next_level_points - state.level_start_points)}`
    : '—';

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
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.playerLabel}</p>
            <p className="mt-2 text-xl font-black text-gold-400">{state?.display_name || '—'}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/55">{state?.uid || 'not connected'}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="nm-card relative overflow-hidden rounded-[1.8rem] p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.3rem] border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">{t.points}</p>
                <p className="mt-3 text-3xl font-black text-white">{formatCount(state?.points || 0)}</p>
              </div>
              <div className="rounded-[1.3rem] border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">{t.level}</p>
                <p className="mt-3 text-3xl font-black text-white">{state?.level || '—'}</p>
              </div>
              <div className="rounded-[1.3rem] border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">{t.multiplier}</p>
                <p className="mt-3 text-3xl font-black text-gold-400">x{state?.multiplier || 1}</p>
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
                disabled={!token || isBusy}
                className={`relative rounded-[2rem] border border-gold-500/30 bg-black/50 p-6 transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
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
              <button type="button" onClick={handleTap} disabled={!token || isBusy} className="nm-action rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50">
                {t.tap}
              </button>
              <button type="button" onClick={handleDailyBonus} disabled={!token || isBusy} className="nm-pill rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-400 disabled:cursor-not-allowed disabled:opacity-50">
                {t.claimBonus}
              </button>
              <button type="button" onClick={refreshState} disabled={!token || isBusy} className="nm-pill rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/80 disabled:cursor-not-allowed disabled:opacity-50">
                {t.reload}
              </button>
              <button type="button" onClick={handleLottery} disabled={!token || isBusy} className="nm-pill rounded-full border-gold-500/25 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-400 disabled:cursor-not-allowed disabled:opacity-50">
                {t.joinLottery}
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                type="number"
                value={referrerId}
                onChange={(event) => setReferrerId(event.target.value)}
                className="rounded-full border border-gold-500/25 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-gold-500"
                placeholder={t.referralPlaceholder}
              />
              <button
                type="button"
                onClick={handleReferral}
                disabled={!token || isBusy || !referrerId.trim()}
                className="nm-pill rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.applyReferral}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="nm-card rounded-[1.8rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.progress}</p>
              <p className="mt-3 text-3xl font-black text-white">{progressValue}</p>
              <p className="mt-2 text-sm leading-7 text-white/58">
                {t.dailyBonus}: {state?.daily_bonus_available ? t.unlocked : formatDate(state?.next_daily_bonus_at || null, locale)}
              </p>
              <p className="text-sm leading-7 text-white/58">
                {t.lottery}: {state?.lottery_joined ? formatDate(state?.lottery_entered_at || null, locale) : t.locked}
              </p>
              <p className="text-sm leading-7 text-white/58">
                Night Mode: {state?.night_mode_unlocked ? t.unlocked : t.locked}
              </p>
            </div>

            <div className="nm-card rounded-[1.8rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.statusLabel}</p>
              <p className="mt-3 text-sm leading-7 text-gold-400">{statusText}</p>
            </div>

            <div className="nm-card rounded-[1.8rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.referrals}</p>
              <p className="mt-3 text-3xl font-black text-white">{state?.referrals || 0}</p>
              <p className="mt-2 text-sm leading-7 text-white/58">
                Telegram ID: {state?.telegram_user_id || '—'}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={openTelegram} className="nm-pill rounded-full border-gold-500/25 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-400">
                  {t.openTelegram}
                </button>
                <button type="button" onClick={connectClicker} disabled={isBusy} className="nm-pill rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/80 disabled:cursor-not-allowed disabled:opacity-50">
                  {t.connect}
                </button>
              </div>
            </div>
          </div>
        </div>

        <section className="nm-card rounded-[1.8rem] p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-gold-400">{t.leaderboard}</h3>
            <button type="button" onClick={() => void loadLeaderboard(token)} className="text-sm text-white/65">
              {t.reload}
            </button>
          </div>
          {leaderboard.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gold-500/20 text-left text-gold-400">
                    <th className="py-2">#</th>
                    <th className="py-2">{t.playerLabel}</th>
                    <th className="py-2">{t.points}</th>
                    <th className="py-2">{t.level}</th>
                    <th className="py-2">{t.referrals}</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((item) => (
                    <tr key={item.uid} className="border-b border-gold-500/10">
                      <td className="py-2">{item.rank}</td>
                      <td className="py-2">{item.display_name}</td>
                      <td className="py-2">{formatCount(item.points)}</td>
                      <td className="py-2">{item.level}</td>
                      <td className="py-2">{item.referrals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/60">{t.noLeaderboard}</p>
          )}
        </section>
      </div>
    </section>
  );
}
