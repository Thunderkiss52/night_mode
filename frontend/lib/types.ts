export type UserLocation = {
  id: string;
  uid: string;
  name: string;
  avatar?: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  createdAt: string;
};

export type UserItem = {
  qrId: string;
  itemName: string;
  photo: string;
  status: 'bound' | 'free';
  boundAt: string;
};

export type UserProfile = {
  uid: string;
  name: string;
  photo: string;
  city: string;
  country: string;
  socials: {
    instagram?: string;
    telegram?: string;
    tiktok?: string;
  };
};

export type CityRanking = {
  city: string;
  country: string;
  countItems: number;
  updatedAt: string;
};
