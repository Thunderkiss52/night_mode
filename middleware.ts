import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['ru', 'en', 'hy', 'kk'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const hasLocale = locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (hasLocale) {
    return NextResponse.next();
  }

  const nextUrl = request.nextUrl.clone();
  nextUrl.pathname = `/ru${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(nextUrl);
}

export const config = {
  matcher: ['/((?!_next).*)']
};
