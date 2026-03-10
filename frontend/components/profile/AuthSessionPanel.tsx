'use client';

import { FormEvent, useState } from 'react';
import { apiUrl } from '@/lib/api';
import { authHeaders, getStoredApiToken, getStoredApiUid } from '@/lib/auth-client';

type TokenResponse = {
  access_token: string;
  expires_in: number;
  uid: string;
  email?: string | null;
};

type MeResponse = {
  uid: string;
  email?: string | null;
};

export default function AuthSessionPanel() {
  const [uid, setUid] = useState('demo-user-1');
  const [email, setEmail] = useState('demo@nightmode.local');
  const [firebaseIdToken, setFirebaseIdToken] = useState('');
  const [message, setMessage] = useState('');
  const [tokenPreview, setTokenPreview] = useState(() => {
    const token = getStoredApiToken();
    return token ? `${token.slice(0, 24)}...` : 'not set';
  });
  const [storedUid, setStoredUid] = useState(() => getStoredApiUid());

  const saveToken = (token: string, tokenUid: string) => {
    window.localStorage.setItem('nm_api_access_token', token);
    window.localStorage.setItem('nm_api_uid', tokenUid);
    setTokenPreview(`${token.slice(0, 24)}...`);
    setStoredUid(tokenUid);
  };

  const loginDev = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch(apiUrl('/api/auth/dev-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, email })
      });
      const data = (await response.json()) as TokenResponse | { detail?: string };
      if (!response.ok || !('access_token' in data)) {
        setMessage(('detail' in data && data.detail) || 'dev-login failed');
        return;
      }
      saveToken(data.access_token, data.uid);
      setMessage(`JWT сохранен (uid: ${data.uid})`);
    } catch {
      setMessage('API недоступен');
    }
  };

  const loginFirebase = async () => {
    setMessage('');

    try {
      const response = await fetch(apiUrl('/api/auth/firebase-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_id_token: firebaseIdToken })
      });
      const data = (await response.json()) as TokenResponse | { detail?: string };
      if (!response.ok || !('access_token' in data)) {
        setMessage(('detail' in data && data.detail) || 'firebase-login failed');
        return;
      }
      saveToken(data.access_token, data.uid);
      setMessage(`JWT сохранен (uid: ${data.uid})`);
    } catch {
      setMessage('API недоступен');
    }
  };

  const checkSession = async () => {
    setMessage('');

    try {
      const response = await fetch(apiUrl('/api/auth/me'), {
        headers: authHeaders()
      });
      const data = (await response.json()) as MeResponse | { detail?: string };
      if (!response.ok || !('uid' in data)) {
        setMessage(('detail' in data && data.detail) || 'not authenticated');
        return;
      }
      setMessage(`Активная сессия: ${data.uid}`);
      setStoredUid(data.uid);
    } catch {
      setMessage('API недоступен');
    }
  };

  return (
    <section className="nm-card rounded-2xl p-5">
      <h3 className="text-xl font-bold text-gold-400">API Session</h3>
      <p className="mt-1 text-xs text-zinc-300">Текущий JWT: {tokenPreview}</p>
      <p className="mt-1 text-xs text-zinc-300">Текущий UID: {storedUid}</p>

      <form className="mt-4 grid gap-2 sm:grid-cols-3" onSubmit={loginDev}>
        <input
          className="rounded border border-gold-500/40 bg-black px-3 py-2 text-sm"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="uid"
        />
        <input
          className="rounded border border-gold-500/40 bg-black px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
        />
        <button className="rounded bg-gold-500 px-4 py-2 font-semibold text-black">Dev Login</button>
      </form>

      <div className="mt-3 flex flex-col gap-2">
        <textarea
          className="min-h-20 rounded border border-gold-500/40 bg-black px-3 py-2 text-xs"
          value={firebaseIdToken}
          onChange={(e) => setFirebaseIdToken(e.target.value)}
          placeholder="Firebase ID token"
        />
        <div className="flex flex-wrap gap-2">
          <button onClick={loginFirebase} className="rounded border border-gold-500/60 px-3 py-2 text-sm text-gold-400">
            Firebase Login
          </button>
          <button onClick={checkSession} className="rounded border border-gold-500/60 px-3 py-2 text-sm text-gold-400">
            Check Session
          </button>
        </div>
      </div>

      {message ? <p className="mt-3 text-sm text-gold-400">{message}</p> : null}
    </section>
  );
}
