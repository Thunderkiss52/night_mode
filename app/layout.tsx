import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Night Mode MVP',
  description: 'Night Mode: карта комьюнити, профиль, QR-мерч и соревнования.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="nm-grid-bg min-h-screen text-white">{children}</body>
    </html>
  );
}
