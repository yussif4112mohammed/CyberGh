import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { runScan } from '@/lib/scanner';
import { execute, query, queryOne } from '@/lib/db';
import { Finding } from '@/types/scan';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── Rate limiting (in-memory, resets on cold start) ────────────
// Sufficient for our scale at launch — upgrade to Redis/Upstash when needed
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;        // max scans per window
const RATE_WINDOW = 60_000;  // 1 minute window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  if (record.count >= RATE_LIMIT) return true;
  record.count++;
  return false;
}

// ── SSRF protection ────────────────────────────────────────────
// Block internal IPs, cloud metadata endpoints, and localhost
const BLOCKED_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,         // AWS/GCP metadata
  /^::1$/,               // IPv6 loopback
  /^fc00:/i,             // IPv6 private
  /^fd[0-9a-f]{2}:/i,   // IPv6 private
  /\.internal$/i,
  /\.local$/i,
];

function normaliseDomain(input: string): string | null {
  try {
    const s = input.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    // Must be a valid hostname
    if (!/^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*$/.test(s)) return null;
    if (!s.includes('.')) return null;
    // Block SSRF vectors
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(s)) return null;
    }
    // Block pure IP addresses (we scan domain names only)
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) return null;
    return s;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many scans. Please wait a minute before scanning again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const domain = normaliseDomain(body.domain || '');

    if (!domain) {
      return NextResponse.json(
        { error: 'Please enter a valid public domain name (e.g. yourbusiness.com.gh)' },
        { status: 400 }
      );
    }

    // Run the scan
    const result = await runScan(domain);

    // Extract user session if logged in
    let userId: number | null = null;
    try {
      const sessionCookie = cookies().get('session')?.value;
      if (sessionCookie) {
        const decoded = jwt.verify(sessionCookie, process.env.JWT_SECRET || 'scanvault_fallback_secret_key_123') as any;
        if (decoded && decoded.userId) {
          userId = decoded.userId;
        }
      }
    } catch (e) {
      // Ignore invalid session token, proceed as guest
    }

    // Look up previous scan for this domain
    const prevScan = await queryOne(
      'SELECT id FROM scans WHERE domain = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
      [domain, 'complete']
    );
    const previousScanId = prevScan?.id || null;

    // Save to database
    await execute(
      'INSERT INTO scans (id, domain, score, status, ip_address, duration_ms, previous_scan_id, user_id, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [result.id, domain, result.score, 'complete', ip, result.duration_ms || null, previousScanId, userId]
    );

    // Save step logs
    if (result.logs && result.logs.length > 0) {
      const logValues = result.logs.map(() => '(?,?,?,?,?)').join(',');
      const logParams = result.logs.flatMap((log: any) => [
        result.id, log.step_name, log.status, log.duration_ms, log.error_msg || null
      ]);
      await execute(
        `INSERT INTO scan_logs (scan_id, step_name, status, duration_ms, error_msg) VALUES ${logValues}`,
        logParams
      );
    }

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
