import type { UserProfile } from '@/lib/types';

export default function ProfileCard({ profile }: { profile: UserProfile }) {
  const socials = Object.entries(profile.socials).filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <section className="nm-card fade-up rounded-2xl p-5">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.photo}
          alt={profile.name}
          className="h-20 w-20 rounded-full border border-gold-500/40 object-cover"
        />
        <div>
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          <p className="text-sm text-gold-400">{profile.city}, {profile.country}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gold-400">
            {socials.map(([network, url]) => (
              <a key={network} href={url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                {network}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
