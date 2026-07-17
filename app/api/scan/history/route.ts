import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const domain = req.nextUrl.searchParams.get('domain');
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
