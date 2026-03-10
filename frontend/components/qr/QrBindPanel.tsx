'use client';

import { FormEvent, useState } from 'react';
import { apiUrl } from '@/lib/api';
import { authHeaders, getStoredApiUid } from '@/lib/auth-client';

type BindResult = {
  ok: boolean;
  message: string;
};

type ErrorShape = {
  message?: string;
  detail?: string;
};

export default function QrBindPanel() {
  const [qrId, setQrId] = useState('NM-HOODIE-1234');
  const [status, setStatus] = useState<BindResult | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);

    try {
      const response = await fetch(apiUrl('/api/qr/bind'), {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          uid: getStoredApiUid(),
          qr_id: qrId,
          item_name: 'Night Mode Item',
          city: 'Yerevan'
        })
      });

      const data = (await response.json()) as BindResult | ErrorShape;
      if (!response.ok) {
        const message = 'message' in data && data.message ? data.message : ('detail' in data && data.detail ? data.detail : 'Bind request failed');
        setStatus({ ok: false, message });
        return;
      }

      setStatus(data as BindResult);
    } catch {
      setStatus({ ok: false, message: 'API недоступен. Проверьте запуск FastAPI backend.' });
    }
  };

  return (
    <section className="nm-card rounded-2xl p-5">
      <h3 className="text-xl font-bold text-gold-400">Привязать QR</h3>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
        <input
          className="w-full rounded border border-gold-500/40 bg-black px-3 py-2"
          value={qrId}
          onChange={(e) => setQrId(e.target.value)}
          placeholder="NM-HOODIE-1234"
        />
        <button className="rounded bg-gold-500 px-4 py-2 font-semibold text-black">Bind</button>
      </form>
      {status ? (
        <p className={`mt-3 text-sm ${status.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{status.message}</p>
      ) : null}
    </section>
  );
}
