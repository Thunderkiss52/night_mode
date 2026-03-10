import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://night-mode.vercel.app';
  const pages = ['', '/map', '/profile', '/competitions', '/qr', '/story'];

  return locales.flatMap((locale) =>
    pages.map((path) => ({
      url: `${baseUrl}/${locale}${path}`,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.7,
      lastModified: new Date()
    }))
  );
}
