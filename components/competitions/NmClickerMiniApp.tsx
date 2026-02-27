'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { apiUrl } from '@/lib/api';

const NM_LOGO_URL =
  'https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/95335625/e1bb5537-e0c5-4917-96aa-8cd63f83a80e/FullSizeRender-3.jpg';

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

type AuthResponse = {
  access_token: string;
  uid: string;
  start_param?: string | null;
  state: ClickerState;
};

type LeaderboardItem = {
  rank: number;
  uid: string;
  telegram_user_id: number | null;
  display_name: string;
  points: number;
  level: number;
  referrals: number;
  updated_at: string;
};

function formatPoints(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.max(0, Math.floor(value)));
}

function parseReferrer(startParam: string | null | undefined): number | null {
  if (!startParam) return null;
  const normalized = startParam.trim();
  if (!normalized.startsWith('ref_')) return null;
  const raw = normalized.slice(4);
  if (!/^\d+$/.test(raw)) return null;
  return Number(raw);
}

function getBotUsername(): string {
  const raw = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '').trim();
  return raw.replace(/^@/, '');
}

function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  const maybeTelegram = (window as unknown as { Telegram?: { WebApp?: any } }).Telegram;
  return maybeTelegram?.WebApp ?? null;
}

export default function NmClickerMiniApp() {
  const [token, setToken] = useState<string>('');
  const [state, setState] = useState<ClickerState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [activePanel, setActivePanel] = useState<'game' | 'rating'>('game');
  const [statusText, setStatusText] = useState<string>('Подключение к NM серверу...');
  const [loading, setLoading] = useState<boolean>(true);
  const [tapPulse, setTapPulse] = useState<boolean>(false);
  const touchStartXRef = useRef<number | null>(null);
  const appliedReferralRef = useRef<boolean>(false);
  const tapQueueRef = useRef<number>(0);
  const tapTimerRef = useRef<number | null>(null);

  const tgUserId = state?.telegram_user_id ?? null;
  const progress = useMemo(() => {
    if (!state) return { current: 0, total: 1 };
    const levelStart = state.level_start_points;
    const next = state.next_level_points ?? levelStart + 1;
    return {
      current: Math.max(0, state.points - levelStart),
      total: Math.max(1, next - levelStart)
    };
  }, [state]);

  const shareUrl = useMemo(() => {
    const botUsername = getBotUsername();
    const refCode = tgUserId ? `ref_${tgUserId}` : '';
    const inviteUrl = botUsername && refCode ? `https://t.me/${botUsername}?start=${refCode}` : '';
    const text = encodeURIComponent('NM Clicker: залетай в игру и забирай +3 уровня');
    if (!inviteUrl) return `https://t.me/share/url?text=${text}`;
    return `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${text}`;
  }, [tgUserId]);

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/api/clicker/leaderboard?limit=50'));
      if (!response.ok) return;
      const data = (await response.json()) as { items?: LeaderboardItem[] };
      if (Array.isArray(data.items)) setLeaderboard(data.items);
    } catch {
      // Ignore network errors in MVP UI.
    }
  }, []);

  const applyReferralIfNeeded = useCallback(
    async (accessToken: string, startParam: string | null | undefined, currentState: ClickerState) => {
      if (appliedReferralRef.current) return;
      if (currentState.referred_by) return;
      const referrer = parseReferrer(startParam);
      if (!referrer) return;

      appliedReferralRef.current = true;
      try {
        const response = await fetch(apiUrl('/api/clicker/referral/apply'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ referrer_telegram_id: referrer })
        });
        if (!response.ok) return;
        const data = (await response.json()) as { ok: boolean; message: string; state: ClickerState };
        setState(data.state);
        setStatusText(data.message);
      } catch {
        // Ignore referral errors to not block app startup.
      }
    },
    []
  );

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const tg = getTelegramWebApp();
      tg?.ready?.();
      tg?.expand?.();

      const query = new URLSearchParams(window.location.search);
      const queryTgId = query.get('tg_id');
      const queryStartParam = query.get('start_param') ?? query.get('startapp');

      const initData = (tg?.initData || '').trim();
      const initStartParam = tg?.initDataUnsafe?.start_param as string | undefined;
      const startParam = initStartParam || queryStartParam;

      const payload: Record<string, unknown> = {};
      if (initData) {
        payload.init_data = initData;
      } else if (queryTgId && /^\d+$/.test(queryTgId)) {
        payload.dev_telegram_user_id = Number(queryTgId);
      } else {
        payload.dev_telegram_user_id = 100001;
      }

      try {
        const response = await fetch(apiUrl('/api/clicker/auth/telegram'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Auth failed');
        }

        const data = (await response.json()) as AuthResponse;
        if (!active) return;
        setToken(data.access_token);
        setState(data.state);
        setStatusText('Игрок авторизован. Тапай логотип NM.');
        setLoading(false);

        await applyReferralIfNeeded(data.access_token, data.start_param || startParam, data.state);
        await loadLeaderboard();
      } catch {
        if (!active) return;
        setLoading(false);
        setStatusText('Ошибка подключения. Проверь backend /api/clicker/auth/telegram.');
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, [applyReferralIfNeeded, loadLeaderboard]);

  const flushTapQueue = useCallback(async () => {
    if (!token || !state) return;

    const taps = tapQueueRef.current;
    tapQueueRef.current = 0;
    tapTimerRef.current = null;
    if (taps <= 0) return;

    try {
      const response = await fetch(apiUrl('/api/clicker/tap'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ taps })
      });
      if (!response.ok) return;
      const data = (await response.json()) as {
        ok: boolean;
        message: string;
        state: ClickerState;
        throttled: boolean;
      };
      setState(data.state);
      setStatusText(data.throttled ? 'Лимит 10 тапов/сек.' : data.message);
    } catch {
      setStatusText('Сеть недоступна. Тапы не отправлены.');
    }
  }, [state, token]);

  const handleTap = useCallback(() => {
    if (!token || !state) return;
    setTapPulse(true);
    window.setTimeout(() => setTapPulse(false), 160);

    tapQueueRef.current += 1;
    if (tapTimerRef.current === null) {
      tapTimerRef.current = window.setTimeout(() => {
        void flushTapQueue();
      }, 120);
    }
  }, [flushTapQueue, state, token]);

  const claimDailyBonus = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(apiUrl('/api/clicker/daily-bonus'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) return;
      const data = (await response.json()) as {
        ok: boolean;
        message: string;
        added_points: number;
        state: ClickerState;
      };
      setState(data.state);
      setStatusText(data.ok ? `Бонус +${formatPoints(data.added_points)}` : data.message);
      await loadLeaderboard();
    } catch {
      setStatusText('Не удалось получить ежедневный бонус.');
    }
  }, [loadLeaderboard, token]);

  const enterLottery = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(apiUrl('/api/clicker/lottery/enter'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) return;
      const data = (await response.json()) as { ok: boolean; message: string; state: ClickerState };
      setState(data.state);
      setStatusText(data.message);
    } catch {
      setStatusText('Ошибка записи в розыгрыш.');
    }
  }, [token]);

  const handleShare = useCallback(() => {
    const tg = getTelegramWebApp();
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
      return;
    }
    window.open(shareUrl, '_blank');
  }, [shareUrl]);

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const diff = endX - touchStartXRef.current;
    if (diff <= -45) setActivePanel('rating');
    if (diff >= 45) setActivePanel('game');
    touchStartXRef.current = null;
  };

  useEffect(() => {
    void loadLeaderboard();
  }, [state?.points, loadLeaderboard]);

  const isNight = Boolean(state?.night_mode_unlocked);
  const progressPercent = Math.min(100, (progress.current / progress.total) * 100);

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border p-4 transition-all duration-500 md:p-6 ${
        isNight
          ? 'border-gold-500/40 bg-[radial-gradient(circle_at_10%_20%,rgba(212,175,55,0.14),transparent_40%),linear-gradient(180deg,#121212_0%,#050505_100%)] shadow-glow'
          : 'border-zinc-300/70 bg-[linear-gradient(180deg,#f5f5f5_0%,#e0e0e0_100%)] text-zinc-900'
      }`}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gold-500/20 blur-3xl" />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className={`text-4xl font-black tracking-wide ${isNight ? 'text-gold-400' : 'text-black'}`}>NM</div>
            <p className={`mt-1 text-xs ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>Уровень x{state?.multiplier ?? 1}</p>
          </div>
          <div className={`text-right text-4xl font-black leading-none ${isNight ? 'text-gold-400' : 'text-black'}`}>
            {formatPoints(state?.points ?? 0)}
          </div>
        </div>

        <div className={`mb-4 h-2 w-full overflow-hidden rounded-full ${isNight ? 'bg-zinc-800' : 'bg-zinc-300'}`}>
          <div
            className={`h-full rounded-full transition-all duration-300 ${isNight ? 'bg-gold-500' : 'bg-zinc-800'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div
            className="flex w-[200%] transition-transform duration-300"
            style={{ transform: activePanel === 'game' ? 'translateX(0%)' : 'translateX(-50%)' }}
          >
            <div className="w-1/2 pr-3">
              <div className="flex min-h-[56vh] flex-col justify-between">
                <div className="flex flex-1 items-center justify-center">
                  <button
                    type="button"
                    onClick={handleTap}
                    disabled={loading || !state}
                    className={`relative h-[200px] w-[200px] overflow-hidden rounded-full border-2 transition-all duration-200 active:scale-95 ${
                      isNight ? 'border-gold-500 shadow-glow' : 'border-white shadow-md'
                    } ${tapPulse ? 'scale-110' : 'scale-100'}`}
                  >
                    <img
                      src={NM_LOGO_URL}
                      alt="NM logo"
                      className={`h-full w-full object-cover transition-all duration-500 ${
                        isNight ? 'brightness-75 contrast-110 saturate-125' : ''
                      }`}
                    />
                    {isNight && <div className="absolute inset-0 bg-gold-500/10 mix-blend-screen" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void claimDailyBonus()}
                    className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                      isNight ? 'bg-zinc-900 text-gold-400' : 'bg-white text-zinc-900'
                    }`}
                  >
                    Ежедневный бонус
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                      isNight ? 'bg-zinc-900 text-gold-400' : 'bg-white text-zinc-900'
                    }`}
                  >
                    Рефералка
                  </button>
                  <button
                    type="button"
                    onClick={() => void enterLottery()}
                    className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                      isNight ? 'bg-zinc-900 text-gold-400' : 'bg-white text-zinc-900'
                    }`}
                  >
                    Розыгрыш
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void loadLeaderboard();
                      setActivePanel('rating');
                    }}
                    className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                      isNight ? 'bg-zinc-900 text-gold-400' : 'bg-white text-zinc-900'
                    }`}
                  >
                    Рейтинг
                  </button>
                </div>
              </div>
            </div>

            <div className="w-1/2 pl-3">
              <div className={`h-full rounded-2xl border p-3 ${isNight ? 'border-gold-500/30 bg-black/30' : 'border-zinc-300 bg-white/70'}`}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className={`text-lg font-bold ${isNight ? 'text-gold-400' : 'text-zinc-900'}`}>Топ-50</h3>
                  <button
                    type="button"
                    onClick={() => setActivePanel('game')}
                    className={`rounded-md px-2 py-1 text-xs ${isNight ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-200 text-zinc-900'}`}
                  >
                    Назад
                  </button>
                </div>

                <div className="max-h-[52vh] overflow-y-auto pr-1">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className={`${isNight ? 'text-gold-400' : 'text-zinc-700'}`}>
                        <th className="py-1 text-left">#</th>
                        <th className="py-1 text-left">Игрок</th>
                        <th className="py-1 text-right">Очки</th>
                        <th className="py-1 text-right">Lvl</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((row) => (
                        <tr key={row.uid} className={`${isNight ? 'border-b border-gold-500/15' : 'border-b border-zinc-300'}`}>
                          <td className="py-1">{row.rank}</td>
                          <td className="py-1">{row.display_name}</td>
                          <td className="py-1 text-right">{formatPoints(row.points)}</td>
                          <td className="py-1 text-right">{row.level}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className={`mt-3 text-sm ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
          {statusText}
          {state?.lottery_joined ? ' В розыгрыше участвуешь.' : ''}
        </p>
      </div>
    </section>
  );
}
