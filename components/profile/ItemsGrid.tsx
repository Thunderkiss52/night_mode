import type { UserItem } from '@/lib/types';

export default function ItemsGrid({ items }: { items: UserItem[] }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xl font-bold text-gold-400">Мой мерч</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <article key={item.qrId} className="nm-card rounded-xl p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.photo} alt={item.itemName} className="h-44 w-full rounded object-cover" />
            <p className="mt-3 text-sm font-semibold">{item.itemName}</p>
            <p className="mt-1 text-xs text-gold-400">QR: {item.qrId}</p>
            <p className="text-xs text-gold-400">Статус: {item.status}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
