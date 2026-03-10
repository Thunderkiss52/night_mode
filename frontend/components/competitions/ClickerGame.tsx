'use client';

import { useEffect, useMemo, useState } from 'react';

type Props = {
  uid: string;
};

const MAX_ENERGY = 100;

export default function ClickerGame({ uid }: Props) {
  const [points, setPoints] = useState(0);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [multiplier, setMultiplier] = useState(1);

  useEffect(() => {
    const raw = window.localStorage.getItem(`nm_clicker_${uid}`);
    if (raw) {
      const parsed = JSON.parse(raw) as { points: number; energy: number; multiplier: number };
      setPoints(parsed.points);
      setEnergy(parsed.energy);
      setMultiplier(parsed.multiplier);
    }
  }, [uid]);

  useEffect(() => {
    window.localStorage.setItem(
      `nm_clicker_${uid}`,
      JSON.stringify({ points, energy, multiplier })
    );
  }, [points, energy, multiplier, uid]);

  useEffect(() => {
    const timer = setInterval(() => {
      setEnergy((current) => Math.min(MAX_ENERGY, current + 2));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const level = useMemo(() => {
    if (points >= 2000) return 'Legend';
    if (points >= 1000) return 'Pro';
    if (points >= 300) return 'Rising';
    return 'Starter';
  }, [points]);

  const handleClick = () => {
    if (energy < 5) return;
    setEnergy((current) => current - 5);
    setPoints((current) => current + 10 * multiplier);
  };

  return (
    <section className="nm-card rounded-2xl p-5">
      <h3 className="text-xl font-bold text-gold-400">Night Clicker</h3>
      <p className="mt-1 text-sm">Points: {points}</p>
      <p className="text-sm">Energy: {energy}/{MAX_ENERGY}</p>
      <p className="text-sm">Level: {level}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={handleClick}
          className="rounded bg-gold-500 px-4 py-2 font-semibold text-black transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={energy < 5}
        >
          Click
        </button>
        <button
          onClick={() => setMultiplier((current) => Math.min(5, current + 1))}
          className="rounded border border-gold-500/60 px-4 py-2 text-gold-400"
        >
          Upgrade x{multiplier}
        </button>
      </div>
    </section>
  );
}
