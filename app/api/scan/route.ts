import { NextRequest, NextResponse } from 'next/server';
import { runScan } from '@/lib/scanner';
import { execute, query } from '@/lib/db';
import { Finding } from '@/types/scan';

function normaliseDomain(input: string): string | null {
  try {
    // Strip protocol and path, just keep hostname
    const s = input.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    // Basic validation
    if (!/^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*$/.test(s)) return null;
    if (!s.includes('.')) return null;
    return s;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const domain = normaliseDomain(body.domain || '');

    if (!domain) {
      return NextResponse.json({ error: 'Please enter a valid domain name (e.g. yourbusiness.com.gh)' }, { status: 400 });
    }

    // Run the scan
    const result = await runScan(domain);

    // Save to database
    await execute(
      'INSERT INTO scans (id, domain, score, status, completed_at) VALUES (?, ?, ?, ?, NOW())',
      [result.id, domain, result.score, 'complete']
    );

    if (result.findings.length > 0) {
      const values = result.findings.map(() => '(?,?,?,?,?,?,?)').join(',');
      const params = result.findings.flatMap((f: Finding) => [
        result.id, f.category, f.severity, f.title, f.description, f.fix || null, f.evidence || null
      ]);
      await execute(
        `INSERT INTO findings (scan_id, category, severity, title, description, fix, evidence) VALUES ${values}`,
        params
      );
    }

    return NextResponse.json({ scanId: result.id, result });
  } catch (err: any) {
    console.error('Scan error:', err);
    return NextResponse.json({ error: 'Scan failed. Please try again.' }, { status: 500 });
  }
}
