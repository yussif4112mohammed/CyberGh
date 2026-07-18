import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  cookies().set('session', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return NextResponse.json({ success: true });
}
