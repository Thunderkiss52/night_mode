'use client';

import { FormEvent, useState } from 'react';
import {
  fetchCurrentUser,
  getStoredApiToken,
  getStoredApiUid,
  getTelegramInitData,
  loginWithTelegram,
  logoutSession,
  refreshAccessToken,
  waitForTelegramInitData
} from '@/lib/auth-client';

export default function AuthSessionPanel() {
  const [devTelegramId, setDevTelegramId] = useState('100001');
  const [username, setUsername] = useState('night_mode_web');
  const [firstName, setFirstName] = useState('Night');
  const [lastName, setLastName] = useState('Mode');
  const [referralCode, setReferralCode] = useState('');
  const [message, setMessage] = useState('');
  const [initDataPreview, setInitDataPreview] = useState(() => (getTelegramInitData() ? 'present' : 'missing'));
  const [tokenPreview, setTokenPreview] = useState(() => {
    const token = getStoredApiToken();
    return token ? `${token.slice(0, 24)}...` : 'not set';
  });
  const [storedUid, setStoredUid] = useState(() => getStoredApiUid());

  const syncPreview = () => {
    const token = getStoredApiToken();
    const uid = getStoredApiUid();
    setTokenPreview(token ? `${token.slice(0, 24)}...` : 'not set');
    setStoredUid(uid);
  };

  const loginTelegram = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const initData = await waitForTelegramInitData();
      setInitDataPreview(initData ? 'present' : 'missing');
      const allowDevFallback = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
      if (!initData && !allowDevFallback) {
        setMessage('Telegram initData is missing. Open this page from the Telegram Mini App button, not from the browser.');
        return;
      }
      const data = await loginWithTelegram(
        initData
          ? { initData, referralCode }
          : {
              devTelegramUserId: Number(devTelegramId),
              referralCode,
              username,
              firstName,
              lastName
            }
      );
      syncPreview();
      setMessage(`JWT сохранен (user: ${data.user?.id || getStoredApiUid()})`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Telegram auth failed');
    }
  };

  const refreshSession = async () => {
    setMessage('');

    try {
      await refreshAccessToken();
      syncPreview();
      setMessage('Access token refreshed');
    } catch {
      setMessage('Refresh failed');
    }
  };

  const checkSession = async () => {
    setMessage('');

    try {
      const user = await fetchCurrentUser();
      syncPreview();
      setMessage(`Активная сессия: ${user.id}, баланс: ${user.balance}`);
    } catch {
      setMessage('Current session not available');
    }
  };

  const onLogout = async () => {
    setMessage('');
    try {
      await logoutSession();
      syncPreview();
      setMessage('Сессия завершена');
    } catch {
      setMessage('Logout failed');
    }
  };

  return (
    <section className="nm-card rounded-2xl p-5">
      <h3 className="text-xl font-bold text-gold-400">API Session</h3>
      <p className="mt-1 text-xs text-zinc-300">Текущий JWT: {tokenPreview}</p>
      <p className="mt-1 text-xs text-zinc-300">Текущий UID: {storedUid}</p>
      <p className="mt-1 text-xs text-zinc-300">Telegram initData: {initDataPreview}</p>

      <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={loginTelegram}>
        <input
          className="rounded border border-gold-500/40 bg-black px-3 py-2 text-sm"
          value={devTelegramId}
          onChange={(e) => setDevTelegramId(e.target.value)}
          placeholder="dev telegram id"
        />
        <input
          className="rounded border border-gold-500/40 bg-black px-3 py-2 text-sm"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          placeholder="referral code"
        />
        <input
          className="rounded border border-gold-500/40 bg-black px-3 py-2 text-sm"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
        />
        <input
          className="rounded border border-gold-500/40 bg-black px-3 py-2 text-sm"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="first name"
        />
        <input
          className="rounded border border-gold-500/40 bg-black px-3 py-2 text-sm"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="last name"
        />
        <button className="rounded bg-gold-500 px-4 py-2 font-semibold text-black">Telegram Login</button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={refreshSession} className="rounded border border-gold-500/60 px-3 py-2 text-sm text-gold-400">
          Refresh
        </button>
        <button onClick={checkSession} className="rounded border border-gold-500/60 px-3 py-2 text-sm text-gold-400">
          Check Session
        </button>
        <button onClick={onLogout} className="rounded border border-white/20 px-3 py-2 text-sm text-white/80">
          Logout
        </button>
      </div>

      <p className="mt-3 text-xs text-white/50">
        В Telegram используется `window.Telegram.WebApp.initData`, локально доступен dev fallback через `dev_telegram_id`.
      </p>

      {message ? <p className="mt-3 text-sm text-gold-400">{message}</p> : null}
    </section>
  );
}
