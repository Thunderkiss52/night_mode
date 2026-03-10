export function getStoredApiToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem('nm_api_access_token');
  if (!token) return null;
  return token.trim() || null;
}

export function getStoredApiUid(fallback = 'demo-user-1'): string {
  if (typeof window === 'undefined') return fallback;
  const uid = window.localStorage.getItem('nm_api_uid');
  if (!uid) return fallback;
  return uid.trim() || fallback;
}

export function authHeaders(base: HeadersInit = {}): HeadersInit {
  const token = getStoredApiToken();
  if (!token) return base;
  return {
    ...base,
    Authorization: `Bearer ${token}`
  };
}
