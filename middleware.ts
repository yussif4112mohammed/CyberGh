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

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
