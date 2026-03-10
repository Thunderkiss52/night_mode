const rawBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim();

export const API_BASE_URL = rawBaseUrl.replace(/\/$/, '');

export function apiUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) return normalized;
  return `${API_BASE_URL}${normalized}`;
}
