import type { Metadata } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';
import 'leaflet/dist/leaflet.css';
import TelegramWebAppInit from '@/components/telegram/TelegramWebAppInit';
import './globals.css';

export const metadata: Metadata = {
  title: 'Night Mode',
  description: 'Night Mode: мир ночного комьюнити.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen text-white">
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <TelegramWebAppInit />
        {children}
      </body>
    </html>
  );
}
