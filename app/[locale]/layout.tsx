import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import LocaleNav from '@/components/layout/LocaleNav';
import PageFrame from '@/components/layout/PageFrame';
import { getMessages, isLocale } from '@/lib/i18n';

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const messages = await getMessages(params.locale);

  return (
    <>
      <LocaleNav locale={params.locale} labels={messages.nav} />
      <PageFrame>{children}</PageFrame>
    </>
  );
}
