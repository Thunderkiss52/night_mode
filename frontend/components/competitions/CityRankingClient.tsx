'use client';

import { useEffect, useState } from 'react';
import CityRankingTable from '@/components/competitions/CityRankingTable';
import { apiUrl } from '@/lib/api';
import { demoCityRanking } from '@/lib/mock-data';
import type { CityRanking } from '@/lib/types';

type RankingApiItem = {
  city: string;
  country: string;
  count_items: number;
  updated_at: string;
};

function fromApiRanking(item: RankingApiItem): CityRanking {
  return {
    city: item.city,
    country: item.country,
    countItems: item.count_items,
    updatedAt: item.updated_at
  };
}

export default function CityRankingClient() {
  const [ranking, setRanking] = useState<CityRanking[]>(demoCityRanking);

  useEffect(() => {
    let active = true;

    async function loadRanking() {
      try {
        const response = await fetch(apiUrl('/api/competitions/city-ranking'));
        if (!response.ok) return;

        const data = (await response.json()) as { ranking?: RankingApiItem[] };
        if (!active || !data.ranking) return;

        setRanking(data.ranking.map(fromApiRanking));
      } catch {
        // Keep demo ranking.
      }
    }

    loadRanking();

    return () => {
      active = false;
    };
  }, []);

  return <CityRankingTable ranking={ranking} />;
}
