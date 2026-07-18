import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const row = await queryOne(
      `SELECT COUNT(*) as count FROM scans WHERE status = 'complete'`,
      []
    );
    return NextResponse.json({ count: parseInt(row?.count || '0', 10) });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
