import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Night Mode',
  description: 'Night Mode: мир ночного комьюнити.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen text-white">{children}</body>
    </html>
  );
}
