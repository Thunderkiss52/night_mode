import { CityRanking, UserItem, UserLocation, UserProfile } from '@/lib/types';

export const demoProfile: UserProfile = {
  uid: 'demo-user-1',
  name: 'Night Rider',
  photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  city: 'Yerevan',
  country: 'Armenia',
  socials: {
    instagram: 'https://instagram.com/nightmode',
    telegram: 'https://t.me/nightmode'
  }
};

export const demoLocations: UserLocation[] = [
  {
    id: 'loc-1',
    uid: 'demo-user-1',
    name: 'Night Rider',
    avatar: demoProfile.photo,
    city: 'Yerevan',
    country: 'Armenia',
    lat: 40.1772,
    lng: 44.5035,
    createdAt: new Date().toISOString()
  },
  {
    id: 'loc-2',
    uid: 'demo-user-2',
    name: 'Moscow Clubber',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    city: 'Moscow',
    country: 'Russia',
    lat: 55.7558,
    lng: 37.6173,
    createdAt: new Date().toISOString()
  },
  {
    id: 'loc-3',
    uid: 'demo-user-3',
    name: 'Almaty Neon',
    avatar: 'https://images.unsplash.com/photo-1541534401786-2077eed87a72?auto=format&fit=crop&w=300&q=80',
    city: 'Almaty',
    country: 'Kazakhstan',
    lat: 43.222,
    lng: 76.8512,
    createdAt: new Date().toISOString()
  }
];

export const demoItems: UserItem[] = [
  {
    qrId: 'NM-HOODIE-0001',
    itemName: 'Night Mode Hoodie: Black Gold',
    photo: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    status: 'bound',
    boundAt: new Date().toISOString()
  },
  {
    qrId: 'NM-TSHIRT-0009',
    itemName: 'Night Mode T-Shirt: Club Edition',
    photo: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    status: 'bound',
    boundAt: new Date().toISOString()
  }
];

export const demoCityRanking: CityRanking[] = [
  { city: 'Yerevan', country: 'Armenia', countItems: 132, updatedAt: new Date().toISOString() },
  { city: 'Moscow', country: 'Russia', countItems: 117, updatedAt: new Date().toISOString() },
  { city: 'Almaty', country: 'Kazakhstan', countItems: 94, updatedAt: new Date().toISOString() },
  { city: 'Tbilisi', country: 'Georgia', countItems: 62, updatedAt: new Date().toISOString() },
  { city: 'Dubai', country: 'UAE', countItems: 41, updatedAt: new Date().toISOString() }
];
