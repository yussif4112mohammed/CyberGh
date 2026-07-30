import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'scanvault_fallback_secret_key_123';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'yussif4112@gmail.com').split(',').map(e => e.trim().toLowerCase());

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ user: null });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(sessionCookie, JWT_SECRET);
    } catch {
      return NextResponse.json({ user: null });
    }

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ user: null });
    }

    // Load user from database
    const user = await queryOne(
      'SELECT id, email, name, company, plan FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());

    return NextResponse.json({ user: { ...user, isAdmin } });
  } catch (err) {
    console.error('Me endpoint error:', err);
    return NextResponse.json({ user: null });
  }
}
