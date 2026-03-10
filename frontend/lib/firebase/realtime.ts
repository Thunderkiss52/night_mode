import { ref, set, update } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase/client';

export async function setClickerPoints(uid: string, points: number) {
  await set(ref(realtimeDb, `competitions/clicker/${uid}`), points);
}

export async function updateCityRanking(city: string, countItems: number) {
  await update(ref(realtimeDb, 'competitions/city_rankings'), {
    [city]: {
      count_items: countItems,
      updated: new Date().toISOString()
    }
  });
}
