'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiUrl } from '@/lib/api';

type LotteryEntry = {
  uid: string;
  telegram_user_id: number | null;
  display_name: string;
  points: number;
  level: number;
  entered_at: string;
};

function formatPoints(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

export default function LotteryAdminClient() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string>(searchParams.get('token') || '');
  const [entries, setEntries] = useState<LotteryEntry[]>([]);
  const [status, setStatus] = useState<string>('Загружаем список розыгрыша...');

  const loadEntries = useCallback(
    async (currentToken: string) => {
      try {
        const query = currentToken ? `?token=${encodeURIComponent(currentToken)}` : '';
        const response = await fetch(apiUrl(`/api/clicker/admin/lottery${query}`));
        if (!response.ok) {
          setStatus(`Ошибка ${response.status}: доступ запрещён или backend недоступен.`);
          return;
        }

        const data = (await response.json()) as { entries?: LotteryEntry[] };
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        setStatus(`Участников: ${Array.isArray(data.entries) ? data.entries.length : 0}`);
      } catch {
        setStatus('Ошибка сети при загрузке списка.');
      }
    },
    []
  );

  useEffect(() => {
    void loadEntries(token);
  }, [loadEntries, token]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadEntries(token);
  };

  return (
    <section className="space-y-4">
      <form onSubmit={onSubmit} className="nm-card rounded-2xl p-4">
        <label className="mb-2 block text-sm text-zinc-300">Admin token</label>
        <div className="flex gap-2">
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            className="w-full rounded-lg border border-gold-500/30 bg-black/60 px-3 py-2 text-sm outline-none focus:border-gold-500"
            placeholder="CLICKER_ADMIN_TOKEN"
          />
          <button type="submit" className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-black">
            Обновить
          </button>
        </div>
      </form>

      <p className="text-sm text-zinc-300">{status}</p>

      <section className="nm-card overflow-hidden rounded-2xl p-4">
        <h2 className="text-xl font-bold text-gold-400">Список для розыгрыша</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gold-500/20 text-left text-gold-400">
                <th className="py-2">UID</th>
                <th className="py-2">Игрок</th>
                <th className="py-2">Очки</th>
                <th className="py-2">Lvl</th>
                <th className="py-2">Дата</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.uid} className="border-b border-gold-500/10">
                  <td className="py-2">{entry.uid}</td>
                  <td className="py-2">{entry.display_name}</td>
                  <td className="py-2">{formatPoints(entry.points)}</td>
                  <td className="py-2">{entry.level}</td>
                  <td className="py-2">{new Date(entry.entered_at).toLocaleString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

