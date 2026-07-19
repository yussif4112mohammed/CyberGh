import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const session = req.cookies.get('session')?.value;
  const url = req.nextUrl.clone();

  // Protect /dashboard
  if (url.pathname.startsWith('/dashboard')) {
    if (!session) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Prevent logged-in users from visiting login or signup pages
  if (url.pathname === '/login' || url.pathname === '/signup') {
    if (session) {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Trigger page view log asynchronously (non-blocking)
  const isPage =
    url.pathname === '/' ||
    url.pathname === '/pricing' ||
    url.pathname === '/compliance' ||
    url.pathname === '/contact' ||
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/report');

  if (isPage && !url.pathname.startsWith('/_next') && !url.pathname.includes('.')) {
    const trackUrl = new URL('/api/analytics/track', req.url);
    fetch(trackUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': req.headers.get('user-agent') || '',
        'x-vercel-ip-country': req.headers.get('x-vercel-ip-country') || '',
        'x-vercel-ip-country-region': req.headers.get('x-vercel-ip-country-region') || '',
        'x-vercel-ip-city': req.headers.get('x-vercel-ip-city') || '',
        'x-forwarded-for': req.headers.get('x-forwarded-for') || '',
        'Cookie': req.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        action: 'view_page',
        path: url.pathname,
        metadata: {
          referrer: req.headers.get('referer') || null,
        },
      }),
    }).catch(() => {});
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
    '/',
    '/pricing',
    '/compliance',
    '/contact',
    '/report/:path*',
  ],
};
