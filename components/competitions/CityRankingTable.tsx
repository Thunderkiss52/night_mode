import type { CityRanking } from '@/lib/types';

export default function CityRankingTable({ ranking }: { ranking: CityRanking[] }) {
  return (
    <section className="nm-card rounded-2xl p-5">
      <h3 className="text-xl font-bold text-gold-400">Топ городов по мерчу</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gold-500/20 text-left text-gold-400">
              <th className="py-2">#</th>
              <th className="py-2">Город</th>
              <th className="py-2">Страна</th>
              <th className="py-2">Мерч</th>
            </tr>
          </thead>
          <tbody>
            {ranking.slice(0, 10).map((item, idx) => (
              <tr key={`${item.city}-${item.country}`} className="border-b border-gold-500/10">
                <td className="py-2">{idx + 1}</td>
                <td className="py-2">{item.city}</td>
                <td className="py-2">{item.country}</td>
                <td className="py-2">{item.countItems}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
