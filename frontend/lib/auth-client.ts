import { apiUrl } from '@/lib/api';

const ACCESS_TOKEN_KEY = 'nm_api_access_token';
const USER_ID_KEY = 'nm_api_uid';

export type AuthUser = {
  id: string;
  telegram_id?: number | null;
  email?: string | null;
  referral_code: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
  language_code?: string | null;
  role: string;
  is_active: boolean;
  is_admin: boolean;
  balance: number;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
};

type AuthPayload = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in?: number;
  user?: AuthUser;
};

type CurrentUserResponse = {
  user: AuthUser;
};

export function getStoredApiToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return null;
  return token.trim() || null;
}

export function getStoredApiUid(fallback = 'anonymous'): string {
  if (typeof window === 'undefined') return fallback;
  const uid = window.localStorage.getItem(USER_ID_KEY);
  if (!uid) return fallback;
  return uid.trim() || fallback;
}

export function saveAccessToken(token: string, userId: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  window.localStorage.setItem(USER_ID_KEY, userId);
}

export function clearStoredSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USER_ID_KEY);
}

export function authHeaders(base: HeadersInit = {}): HeadersInit {
  const token = getStoredApiToken();
  if (!token) return base;
  return {
    ...base,
    Authorization: `Bearer ${token}`
  };
}

function storeAuthPayload(payload: AuthPayload) {
  if (payload.user?.id) {
    saveAccessToken(payload.access_token, payload.user.id);
    return;
  }

  const fallbackUserId = getStoredApiUid();
  saveAccessToken(payload.access_token, fallbackUserId);
}

export function getTelegramInitData(): string {
  if (typeof window === 'undefined') return '';
  const tg = window as Window & {
    Telegram?: {
      WebApp?: {
        initData?: string;
      };
    };
  };
  return tg.Telegram?.WebApp?.initData?.trim() || '';
}

export async function loginWithTelegram(payload: {
  initData?: string;
  referralCode?: string;
  devTelegramUserId?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
}) {
  const body = payload.initData
    ? {
        init_data: payload.initData,
        referral_code: payload.referralCode
      }
    : {
        dev_telegram_user_id: payload.devTelegramUserId,
        referral_code: payload.referralCode,
        username: payload.username,
        first_name: payload.firstName,
        last_name: payload.lastName
      };

  const response = await fetch(apiUrl('/auth/telegram'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const data = (await response.json()) as AuthPayload | { detail?: string };
  if (!response.ok || !('access_token' in data)) {
    throw new Error(('detail' in data && data.detail) || 'Telegram auth failed');
  }

  storeAuthPayload(data);
  return data;
}

export async function refreshAccessToken() {
  const response = await fetch(apiUrl('/auth/refresh'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  const data = (await response.json()) as AuthPayload | { detail?: string };
  if (!response.ok || !('access_token' in data)) {
    clearStoredSession();
    throw new Error(('detail' in data && data.detail) || 'Refresh failed');
  }

  storeAuthPayload(data);
  return data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await fetch(apiUrl('/auth/me'), {
    headers: authHeaders(),
    credentials: 'include'
  });

  if (response.status === 401) {
    await refreshAccessToken();
    const retry = await fetch(apiUrl('/auth/me'), {
      headers: authHeaders(),
      credentials: 'include'
    });
    const retryData = (await retry.json()) as CurrentUserResponse | { detail?: string };
    if (!retry.ok || !('user' in retryData)) {
      throw new Error(('detail' in retryData && retryData.detail) || 'Failed to load current user');
    }
    const refreshedToken = getStoredApiToken();
    if (refreshedToken) {
      saveAccessToken(refreshedToken, retryData.user.id);
    }
    return retryData.user;
  }

  const data = (await response.json()) as CurrentUserResponse | { detail?: string };
  if (!response.ok || !('user' in data)) {
    throw new Error(('detail' in data && data.detail) || 'Failed to load current user');
  }

  const token = getStoredApiToken();
  if (token) {
    saveAccessToken(token, data.user.id);
  }
  return data.user;
}

export async function logoutSession() {
  await fetch(apiUrl('/auth/logout'), {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({})
  });
  clearStoredSession();
}
