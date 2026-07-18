import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'scanvault_fallback_secret_key_123';

export async function GET(req: NextRequest) {
  try {
    const domain = req.nextUrl.searchParams.get('domain');
    const userOnly = req.nextUrl.searchParams.get('user') === 'true';

    // Decode session token
    let userId: number | null = null;
    try {
      const sessionCookie = cookies().get('session')?.value;
      if (sessionCookie) {
        const decoded = jwt.verify(sessionCookie, JWT_SECRET) as any;
        if (decoded && decoded.userId) {
          userId = decoded.userId;
        }
      }
    } catch {}

    if (userOnly) {
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Fetch latest 30 scans run by this user
      const rows = await query(
        `SELECT id, domain, score, status, created_at FROM scans
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 30`,
        [userId]
      );
      return NextResponse.json({ history: rows });
    }

    if (!domain) {
      return NextResponse.json({ error: 'domain is required' }, { status: 400 });
    }

    const rows = await query(
      `SELECT id, score, created_at FROM scans
       WHERE domain = $1 AND status = 'complete' AND score IS NOT NULL
       ORDER BY created_at ASC
       LIMIT 20`,
      [domain]
    );

    return NextResponse.json({ history: rows });
  } catch (err) {
    console.error('History error:', err);
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
  }
}
