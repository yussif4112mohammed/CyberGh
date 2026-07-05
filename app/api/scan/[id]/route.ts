import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { ScanResult } from '@/types/scan';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const scan = await queryOne(
      'SELECT * FROM scans WHERE id = ?',
      [params.id]
    );

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    const findings = await query(
      `SELECT * FROM findings WHERE scan_id = $1
       ORDER BY CASE severity
         WHEN 'critical' THEN 1
         WHEN 'high'     THEN 2
         WHEN 'medium'   THEN 3
         WHEN 'low'      THEN 4
         WHEN 'info'     THEN 5
         WHEN 'pass'     THEN 6
         ELSE 7 END`,
      [params.id]
    );

    const summary = {
      critical: findings.filter((f: any) => f.severity === 'critical').length,
      high:     findings.filter((f: any) => f.severity === 'high').length,
      medium:   findings.filter((f: any) => f.severity === 'medium').length,
      low:      findings.filter((f: any) => f.severity === 'low').length,
      info:     findings.filter((f: any) => f.severity === 'info').length,
      pass:     findings.filter((f: any) => f.severity === 'pass').length,
    };

    const result: ScanResult = {
      id: scan.id,
      domain: scan.domain,
      score: scan.score,
      status: scan.status,
      findings,
      summary,
      created_at: scan.created_at,
      completed_at: scan.completed_at,
    };

    return NextResponse.json({ result });
  } catch (err) {
    console.error('Fetch scan error:', err);
    return NextResponse.json({ error: 'Failed to fetch scan result' }, { status: 500 });
  }
}

// Save email to unlock full report
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }
    await import('@/lib/db').then(({ execute }) =>
      execute('UPDATE scans SET email = ? WHERE id = ?', [email.toLowerCase(), params.id])
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save email' }, { status: 500 });
  }
}
