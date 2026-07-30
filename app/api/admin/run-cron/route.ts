import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'scanvault_fallback_secret_key_123';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'yussif4112@gmail.com').split(',').map(e => e.trim().toLowerCase());
const CRON_SECRET = process.env.CRON_SECRET || 'scanvault_fallback_cron_secret_key_2026';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function isAdmin() {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) return false;

  try {
    const decoded = jwt.verify(sessionCookie, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) return false;

    const user = await queryOne(
      'SELECT email FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!user) return false;

    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const authorized = await isAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Securely trigger the cron endpoint internally
    const res = await fetch(`${APP_URL}/api/monitor/cron`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('Run Cron error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
