import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { queryOne, execute } from '@/lib/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'scanvault_fallback_secret_key_123';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'yussif4112mohammed@gmail.com').split(',').map(e => e.trim().toLowerCase());

async function isAdmin() {
  const sessionCookie = cookies().get('session')?.value;
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

    const { userId, plan } = await req.json();

    if (!userId || !plan || !['free', 'starter', 'pro'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Update plan in users table
    const result = await execute(
      'UPDATE users SET plan = ? WHERE id = ?',
      [plan, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `User plan updated to ${plan}` });
  } catch (err) {
    console.error('Admin user plan error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
