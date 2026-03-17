'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { apiUrl } from '@/lib/api';

type Props = {
  locale: Locale;
};

type FloatingBonus = {
  id: number;
  left: string;
  value: string;
};

type TapRipple = {
  id: number;
  size: number;
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

type StatusTone = 'neutral' | 'success' | 'warning' | 'error';

type StatusState = {
  text: string;
  tone: StatusTone;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      openTelegramLink?: (value: string) => void;
    };
  };
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
    lotteryJoined: string;
    openTelegram: string;
    applyReferral: string;
    referralPlaceholder: string;
    leaderboard: string;
    connect: string;
    waitingTelegram: string;
    connectReady: string;
    connectRestored: string;
    browserHint: string;
    statusLabel: string;
    playerLabel: string;
    noLeaderboard: string;
    perTap: string;
    sync: string;
    tapZone: string;
    miniAppReady: string;
    miniAppMissing: string;
    identity: string;
    lastUpdate: string;
  }
> = {
  ru: {
    kicker: 'telegram mini app',
    title: 'NM Clicker',
    description:
      'Night mode: мир ночного комьюнити. Зарядись энергией ночи с лучшими людьми мира, собирай очки, забирай бонусы и заходи в лотерею прямо внутри Telegram.',
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
    lotteryJoined: 'Уже в лотерее',
    openTelegram: 'Открыть бота',
    applyReferral: 'Применить',
    referralPlaceholder: 'Telegram ID реферера',
    leaderboard: 'Лидерборд',
    connect: 'Переподключить',
    waitingTelegram: 'Подключаем Telegram Mini App...',
    connectReady: 'Профиль кликера подключён.',
    connectRestored: 'Сессия кликера восстановлена.',
    browserHint: 'Для полного режима открой кликер из Telegram Mini App.',
    statusLabel: 'Статус',
    playerLabel: 'Игрок',
    noLeaderboard: 'Пока никто не ворвался в топ. Будь первым.',
    perTap: 'за тап',
    sync: 'Синхронизация',
    tapZone: 'Точка удара',
    miniAppReady: 'Telegram Mini App активен',
    miniAppMissing: 'Страница открыта вне Mini App',
    identity: 'Профиль',
    lastUpdate: 'Обновлено'
  },
  en: {
    kicker: 'telegram mini app',
    title: 'NM Clicker',
    description:
      'Night mode is the world of the night community. Charge up with the best people around you, stack points, claim bonuses, and jump into the lottery inside Telegram.',
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
    lotteryJoined: 'Already joined',
    openTelegram: 'Open bot',
    applyReferral: 'Apply',
    referralPlaceholder: 'Referrer Telegram ID',
    leaderboard: 'Leaderboard',
    connect: 'Reconnect',
    waitingTelegram: 'Connecting Telegram Mini App...',
    connectReady: 'Clicker profile connected.',
    connectRestored: 'Clicker session restored.',
    browserHint: 'Open the clicker from Telegram Mini App for full mode.',
    statusLabel: 'Status',
    playerLabel: 'Player',
    noLeaderboard: 'No one has taken the top yet.',
    perTap: 'per tap',
    sync: 'Sync',
    tapZone: 'Impact zone',
    miniAppReady: 'Telegram Mini App active',
    miniAppMissing: 'Opened outside Mini App',
    identity: 'Profile',
    lastUpdate: 'Updated'
  },
  am: {
    kicker: 'telegram mini app',
    title: 'NM Clicker',
    description:
      'Night mode-ը գիշերային community-ի աշխարհն է. հավաքիր միավորներ, վերցրու bonus-ները և մտիր lottery հենց Telegram-ի ներսում:',
    points: 'Միավորներ',
    level: 'Մակարդակ',
    multiplier: 'Բազմապատկիչ',
    referrals: 'Ռեֆերալներ',
    progress: 'Պրոգրես',
    dailyBonus: 'Daily bonus',
    lottery: 'Lottery',
    unlocked: 'Բաց է',
    locked: 'Փակ է',
    tap: 'Tap',
    reload: 'Reload',
    claimBonus: 'Claim bonus',
    joinLottery: 'Join lottery',
    lotteryJoined: 'Already joined',
    openTelegram: 'Open bot',
    applyReferral: 'Apply',
    referralPlaceholder: 'Referrer Telegram ID',
    leaderboard: 'Leaderboard',
    connect: 'Reconnect',
    waitingTelegram: 'Connecting Telegram Mini App...',
    connectReady: 'Clicker profile connected.',
    connectRestored: 'Clicker session restored.',
    browserHint: 'Բացիր Mini App-ը Telegram-ի միջից:',
    statusLabel: 'Status',
    playerLabel: 'Player',
    noLeaderboard: 'Leaderboard-ը դեռ դատարկ է:',
    perTap: 'per tap',
    sync: 'Sync',
    tapZone: 'Impact zone',
    miniAppReady: 'Telegram Mini App active',
    miniAppMissing: 'Opened outside Mini App',
    identity: 'Profile',
    lastUpdate: 'Updated'
  },
  kk: {
    kicker: 'telegram mini app',
    title: 'NM Clicker',
    description:
      'Night mode түнгі community әлемі. Ұпай жина, бонус ал және Telegram ішінде лотереяға қосыл.',
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
    lotteryJoined: 'Кіріп қойған',
    openTelegram: 'Ботты ашу',
    applyReferral: 'Қолдану',
    referralPlaceholder: 'Реферер Telegram ID',
    leaderboard: 'Лидерборд',
    connect: 'Қайта қосу',
    waitingTelegram: 'Telegram Mini App қосылып жатыр...',
    connectReady: 'Clicker профилі қосылды.',
    connectRestored: 'Clicker сессиясы қалпына келді.',
    browserHint: 'Толық режим үшін кликерді Telegram Mini App ішінен аш.',
    statusLabel: 'Статус',
    playerLabel: 'Ойыншы',
    noLeaderboard: 'Әзірге топты ешкім алған жоқ.',
    perTap: 'әр тап',
    sync: 'Синхрон',
    tapZone: 'Соққы аймағы',
    miniAppReady: 'Telegram Mini App белсенді',
    miniAppMissing: 'Mini App сыртында ашылған',
    identity: 'Профиль',
    lastUpdate: 'Жаңартылды'
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
  return window.localStorage.getItem(CLICKER_TOKEN_KEY)?.trim() || null;
}

function saveClickerSession(token: string, uid: string) {
  window.localStorage.setItem(CLICKER_TOKEN_KEY, token);
  window.localStorage.setItem(CLICKER_UID_KEY, uid);
}

function getTelegramUrl() {
  const username = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '').replace(/^@/, '').trim();
  if (!username) return '';
  return `https://t.me/${username}?startapp=clicker`;
}

function getTelegramInitData() {
  if (typeof window === 'undefined') return '';
  const tg = window as TelegramWindow;
  return tg.Telegram?.WebApp?.initData?.trim() || '';
}

async function waitForTelegramInitData(timeoutMs = 4000, intervalMs = 150) {
  const startedAt = Date.now();
  let initData = getTelegramInitData();

  while (!initData && Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
    initData = getTelegramInitData();
  }

  return initData;
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

function shortUid(uid: string | null | undefined) {
  if (!uid) return '—';
  if (uid.length <= 12) return uid;
  return `${uid.slice(0, 8)}…${uid.slice(-4)}`;
}

function isLocalDebugMode() {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

async function readResponseError(response: Response, fallback: string) {
  const raw = await response.text();
  if (!raw.trim()) return fallback;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/html') || raw.toLowerCase().includes('<html')) {
    return 'Night Mode gateway is temporarily unavailable. Please try again in a moment.';
  }

  try {
    const parsed = JSON.parse(raw) as { detail?: string };
    if (parsed.detail?.trim()) return parsed.detail;
  } catch {}

  return raw.slice(0, 220);
}

function localizeBackendMessage(message: string, locale: Locale, amount = 0) {
  const translations: Record<string, Partial<Record<Locale, string>>> = {
    'Tap accepted.': {
      ru: amount > 0 ? `Ещё +${amount} очков в копилку.` : 'Тап засчитан.',
      en: amount > 0 ? `+${amount} points landed.` : 'Tap accepted.',
      am: amount > 0 ? `+${amount} միավոր ավելացավ.` : 'Tap accepted.',
      kk: amount > 0 ? `+${amount} ұпай қосылды.` : 'Тап қабылданды.'
    },
    'Part of taps were rejected by anti-cheat.': {
      ru: 'Часть тапов отфильтрована защитой от спама.',
      en: 'Some taps were filtered by anti-spam protection.',
      am: 'Թափերից մի մասը մերժվեց anti-spam պաշտպանությամբ.',
      kk: 'Таптардың бір бөлігі антиспаммен сүзілді.'
    },
    'Daily bonus claimed.': {
      ru: amount > 0 ? `Daily bonus забран: +${amount}.` : 'Daily bonus забран.',
      en: amount > 0 ? `Daily bonus claimed: +${amount}.` : 'Daily bonus claimed.',
      am: amount > 0 ? `Daily bonus վերցված է. +${amount}.` : 'Daily bonus claimed.',
      kk: amount > 0 ? `Daily bonus алынды: +${amount}.` : 'Daily bonus claimed.'
    },
    'Daily bonus already claimed today.': {
      ru: 'Сегодняшний daily bonus уже забран.',
      en: 'Today’s daily bonus has already been claimed.',
      am: 'Այսօրվա daily bonus-ը արդեն վերցված է:',
      kk: 'Бүгінгі daily bonus already алынған.'
    },
    'Referral applied successfully.': {
      ru: 'Реферал успешно применён.',
      en: 'Referral applied successfully.',
      am: 'Referral-ը հաջողությամբ կիրառվեց:',
      kk: 'Реферал сәтті қолданылды.'
    },
    'Referral already applied.': {
      ru: 'Реферал уже был привязан раньше.',
      en: 'Referral has already been applied.',
      am: 'Referral-ը արդեն қолданված է:',
      kk: 'Реферал бұрыннан қолданылған.'
    },
    'Lottery entry saved.': {
      ru: 'Заявка в лотерею сохранена.',
      en: 'Lottery entry saved.',
      am: 'Lottery entry saved.',
      kk: 'Лотереяға өтінім сақталды.'
    },
    'You are already in the lottery.': {
      ru: 'Ты уже участвуешь в лотерее.',
      en: 'You are already in the lottery.',
      am: 'Դու արդեն lottery-ի մեջ ես:',
      kk: 'Сен лотереяда әлдеқашан барсың.'
    }
  };

  const localized = translations[message]?.[locale];
  return localized || message;
}

function getStatusTone(text: string): StatusTone {
  const lower = text.toLowerCase();
  if (lower.includes('ошиб') || lower.includes('failed') || lower.includes('invalid') || lower.includes('missing')) {
    return 'error';
  }
  if (lower.includes('already') || lower.includes('уже') || lower.includes('anti') || lower.includes('spam')) {
    return 'warning';
  }
  if (lower.includes('saved') || lower.includes('connected') || lower.includes('claimed') || lower.includes('готов') || lower.includes('подключ')) {
    return 'success';
  }
  return 'neutral';
}

export default function NmClickerMiniApp({ locale }: Props) {
  const t = copy[locale];
  const telegramUrl = getTelegramUrl();
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<ClickerState | null>(null);
  const [leaderboard, setLeaderboard] = useState<ClickerLeaderboardItem[]>([]);
  const [status, setStatus] = useState<StatusState>({ text: t.waitingTelegram, tone: 'neutral' });
  const [isBusy, setIsBusy] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [referrerId, setReferrerId] = useState('');
  const [floatingBonuses, setFloatingBonuses] = useState<FloatingBonus[]>([]);
  const [ripples, setRipples] = useState<TapRipple[]>([]);
  const [telegramContext, setTelegramContext] = useState<'present' | 'missing'>(() =>
    getTelegramInitData() ? 'present' : 'missing'
  );

  const progressPercent = useMemo(() => {
    if (!state) return 0;
    if (state.next_level_points === null) return 100;
    const current = Math.max(0, state.points - state.level_start_points);
    const total = Math.max(1, state.next_level_points - state.level_start_points);
    return Math.min(100, Math.round((current / total) * 100));
  }, [state]);

  const tapPower = Math.max(1, state?.multiplier || 1);
  const statusChipClass = {
    neutral: 'border-white/10 bg-white/5 text-white/72',
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    warning: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
    error: 'border-rose-500/25 bg-rose-500/10 text-rose-200'
  }[status.tone];

  const spawnBonus = (value: string) => {
    const id = Date.now() + Math.round(Math.random() * 1000);
    setFloatingBonuses((current) => [...current, { id, left: `${22 + Math.random() * 56}%`, value }]);
    window.setTimeout(() => {
      setFloatingBonuses((current) => current.filter((item) => item.id !== id));
    }, 900);
  };

  const spawnRipple = () => {
    const id = Date.now() + Math.round(Math.random() * 1000);
    const size = 170 + Math.round(Math.random() * 70);
    setRipples((current) => [...current, { id, size }]);
    window.setTimeout(() => {
      setRipples((current) => current.filter((item) => item.id !== id));
    }, 720);
  };

  const setStatusText = (text: string, tone?: StatusTone) => {
    setStatus({ text, tone: tone || getStatusTone(text) });
  };

  const openTelegram = () => {
    if (!telegramUrl) {
      setStatusText('NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is not configured.', 'error');
      return;
    }

    const tg = window as TelegramWindow;
    if (tg.Telegram?.WebApp?.openTelegramLink) {
      tg.Telegram.WebApp.openTelegramLink(telegramUrl);
      return;
    }

    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
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
    setStatusText(t.waitingTelegram, 'neutral');

    try {
      const initData = await waitForTelegramInitData();
      setTelegramContext(initData ? 'present' : 'missing');

      if (!initData && !isLocalDebugMode()) {
        setStatusText(t.browserHint, 'warning');
        return;
      }

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

      if (!response.ok) {
        setStatusText(await readResponseError(response, 'Clicker auth failed'), 'error');
        return;
      }

      const data = (await response.json()) as ClickerAuthResponse;
      saveClickerSession(data.access_token, data.uid);
      setToken(data.access_token);
      setState(data.state);
      setStatusText(t.connectReady, 'success');
      await loadLeaderboard(data.access_token);
    } catch {
      setStatusText('Clicker API недоступен.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    setStatusText(copy[locale].waitingTelegram, 'neutral');
  }, [locale]);

  // Restoring the clicker session is intentionally tied to locale copy, not function identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setStatusText(t.connectRestored, 'success');
        setTelegramContext(getTelegramInitData() ? 'present' : 'missing');
        await loadLeaderboard(storedToken);
      } catch {
        await connectClicker();
      }
    }

    void restoreOrConnect();

    return () => {
      active = false;
    };
  }, [t.connectRestored]);

  const refreshState = async () => {
    if (!token) return;

    setIsBusy(true);
    try {
      const response = await fetch(apiUrl('/api/clicker/state'), {
        headers: clickerHeaders(token)
      });
      if (!response.ok) {
        setStatusText(await readResponseError(response, 'State refresh failed'), 'error');
        return;
      }
      const data = (await response.json()) as ClickerStateResponse;
      setState(data.state);
      setStatusText(`${t.sync}: ${t.lastUpdate.toLowerCase()} ${formatDate(data.state.updated_at, locale)}`, 'neutral');
    } catch {
      setStatusText('Не удалось обновить состояние кликера.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleTap = async () => {
    if (!token) return;

    setIsBusy(true);
    setIsPressed(true);
    spawnRipple();

    try {
      const response = await fetch(apiUrl('/api/clicker/tap'), {
        method: 'POST',
        headers: clickerHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ taps: 1 })
      });

      if (!response.ok) {
        setStatusText(await readResponseError(response, 'Tap failed'), 'error');
        return;
      }

      const data = (await response.json()) as ClickerTapResponse;
      setState(data.state);
      setStatusText(localizeBackendMessage(data.message, locale, data.added_points));
      if (data.added_points > 0) {
        spawnBonus(`+${data.added_points}`);
      }
      await loadLeaderboard(token);
    } catch {
      setStatusText('Не удалось отправить tap.', 'error');
    } finally {
      window.setTimeout(() => setIsPressed(false), 150);
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
      if (!response.ok) {
        setStatusText(await readResponseError(response, 'Daily bonus failed'), 'error');
        return;
      }
      const data = (await response.json()) as ClickerTapResponse;
      setState(data.state);
      setStatusText(localizeBackendMessage(data.message, locale, data.added_points));
      if (data.added_points > 0) {
        spawnBonus(`+${data.added_points}`);
      }
      await loadLeaderboard(token);
    } catch {
      setStatusText('Не удалось забрать daily bonus.', 'error');
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
      if (!response.ok) {
        setStatusText(await readResponseError(response, 'Lottery request failed'), 'error');
        return;
      }
      const data = (await response.json()) as ClickerTapResponse;
      setState(data.state);
      setStatusText(localizeBackendMessage(data.message, locale), data.ok ? 'success' : 'warning');
    } catch {
      setStatusText('Не удалось войти в лотерею.', 'error');
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
      if (!response.ok) {
        setStatusText(await readResponseError(response, 'Referral apply failed'), 'error');
        return;
      }
      const data = (await response.json()) as ClickerTapResponse;
      setState(data.state);
      setStatusText(localizeBackendMessage(data.message, locale), data.ok ? 'success' : 'warning');
      await loadLeaderboard(token);
    } catch {
      setStatusText('Не удалось применить referral.', 'error');
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
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(230,196,89,0.16),transparent_65%)]" />
      <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_65%)]" />

      <div className="relative space-y-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-gold-300">
                {t.kicker}
              </span>
              <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${telegramContext === 'present' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/5 text-white/60'}`}>
                {telegramContext === 'present' ? t.miniAppReady : t.miniAppMissing}
              </span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-white">{t.title}</h2>
            <p className="max-w-2xl text-sm leading-7 text-white/68">{t.description}</p>
          </div>

          <div className="grid gap-2 rounded-[1.6rem] border border-white/10 bg-black/35 px-5 py-4 text-right shadow-[0_18px_40px_rgba(0,0,0,0.25)]">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.playerLabel}</p>
            <p className="text-2xl font-black text-gold-400">{state?.display_name || 'Night Mode'}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-white/55">
              {state?.username ? `@${state.username}` : shortUid(state?.uid)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="nm-card rounded-[1.4rem] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">{t.points}</p>
                <p className="mt-3 text-4xl font-black text-white">{formatCount(state?.points || 0)}</p>
              </div>
              <div className="nm-card rounded-[1.4rem] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">{t.level}</p>
                <p className="mt-3 text-4xl font-black text-white">{state?.level || '—'}</p>
              </div>
              <div className="nm-card rounded-[1.4rem] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">{t.multiplier}</p>
                <p className="mt-3 text-4xl font-black text-gold-400">x{state?.multiplier || 1}</p>
              </div>
            </div>

            <div className="nm-card rounded-[1.9rem] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.tapZone}</p>
                  <p className="mt-2 text-sm text-white/62">
                    +{tapPower} {t.perTap}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.identity}</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {state?.telegram_user_id ? `TG ${state.telegram_user_id}` : shortUid(state?.uid)}
                  </p>
                </div>
              </div>

              <div className="nm-tap-arena relative mt-5 flex min-h-[340px] items-center justify-center overflow-hidden rounded-[1.9rem] border border-white/8 bg-black/30">
                <div className="nm-tap-grid absolute inset-0" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,196,89,0.16),transparent_58%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_36%)]" />

                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    className="nm-tap-ripple pointer-events-none absolute"
                    style={{ width: ripple.size, height: ripple.size }}
                  />
                ))}

                {floatingBonuses.map((bonus) => (
                  <span
                    key={bonus.id}
                    className="nm-floating-bonus pointer-events-none absolute top-1/2 text-2xl font-black text-gold-400"
                    style={{ left: bonus.left }}
                  >
                    {bonus.value}
                  </span>
                ))}

                <button
                  type="button"
                  onClick={handleTap}
                  disabled={!token || isBusy}
                  className={`nm-tap-core ${isPressed ? 'nm-tap-core--pressed' : ''}`}
                >
                  <span className="nm-tap-core__halo" />
                  <span className="nm-tap-core__label">{t.tap}</span>
                  <span className="nm-tap-core__value">+{tapPower}</span>
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  type="button"
                  onClick={handleTap}
                  disabled={!token || isBusy}
                  className="nm-action rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.tap}
                </button>
                <button
                  type="button"
                  onClick={handleDailyBonus}
                  disabled={!token || isBusy || !state?.daily_bonus_available}
                  className="nm-pill rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.claimBonus}
                </button>
                <button
                  type="button"
                  onClick={refreshState}
                  disabled={!token || isBusy}
                  className="nm-pill rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.reload}
                </button>
                <button
                  type="button"
                  onClick={handleLottery}
                  disabled={!token || isBusy || Boolean(state?.lottery_joined)}
                  className="nm-pill rounded-full border-gold-500/25 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {state?.lottery_joined ? t.lotteryJoined : t.joinLottery}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="nm-card rounded-[1.8rem] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.progress}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-gold-400">
                  {progressPercent}%
                </p>
              </div>
              <p className="mt-3 text-3xl font-black text-white">{progressValue}</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#8f5e19_0%,#d4af37_45%,#f3d46f_100%)]" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="mt-5 space-y-3 text-sm leading-6 text-white/62">
                <p>{t.dailyBonus}: {state?.daily_bonus_available ? t.unlocked : formatDate(state?.next_daily_bonus_at || null, locale)}</p>
                <p>{t.lottery}: {state?.lottery_joined ? formatDate(state?.lottery_entered_at || null, locale) : t.locked}</p>
                <p>Night Mode: {state?.night_mode_unlocked ? t.unlocked : t.locked}</p>
                <p>{t.lastUpdate}: {formatDate(state?.updated_at || null, locale)}</p>
              </div>
            </div>

            <div className="nm-card rounded-[1.8rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.statusLabel}</p>
              <div className={`mt-4 rounded-[1.2rem] border px-4 py-3 text-sm leading-6 ${statusChipClass}`}>
                {status.text}
              </div>
            </div>

            <div className="nm-card rounded-[1.8rem] p-5">
              <div className="grid gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">{t.referrals}</p>
                  <p className="mt-3 text-3xl font-black text-white">{state?.referrals || 0}</p>
                  <p className="mt-2 text-sm text-white/58">
                    Telegram ID: {state?.telegram_user_id || '—'}
                  </p>
                </div>

                <div className="grid gap-3">
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

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openTelegram}
                    disabled={!telegramUrl}
                    className="nm-pill rounded-full border-gold-500/25 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t.openTelegram}
                  </button>
                  <button
                    type="button"
                    onClick={connectClicker}
                    disabled={isBusy}
                    className="nm-pill rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t.connect}
                  </button>
                </div>
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
                      <td className="py-3">{item.rank}</td>
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{item.display_name}</span>
                          <span className="text-xs text-white/45">{item.telegram_user_id ? `TG ${item.telegram_user_id}` : shortUid(item.uid)}</span>
                        </div>
                      </td>
                      <td className="py-3">{formatCount(item.points)}</td>
                      <td className="py-3">{item.level}</td>
                      <td className="py-3">{item.referrals}</td>
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
