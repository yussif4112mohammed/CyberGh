import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query, queryOne, execute } from '@/lib/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'scanvault_fallback_secret_key_123';

const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  starter: 3,
  pro: 10,
};

// Helper: Authenticate user from session cookie
async function getAuthUser() {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = jwt.verify(sessionCookie, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) return null;

    return await queryOne(
      'SELECT id, email, plan FROM users WHERE id = $1',
      [decoded.userId]
    );
  } catch {
    return null;
  }
}

// Helper: Normalise domain input
function normaliseDomain(input: string): string | null {
  try {
    const s = input.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (!/^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*$/.test(s)) return null;
    if (!s.includes('.')) return null;
    return s;
  } catch {
    return null;
  }
}

// ── GET: List monitored domains ────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await query(
      `SELECT id, domain, verified, verification_token, created_at, last_scan_at FROM monitored_domains
       WHERE user_id = $1
       ORDER BY domain ASC`,
      [user.id]
    );

    return NextResponse.json({ domains: rows });
  } catch (err) {
    console.error('List monitoring error:', err);
    return NextResponse.json({ error: 'Failed to retrieve monitored domains' }, { status: 500 });
  }
}

// ── POST: Add domain to monitoring ─────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain: rawDomain } = await req.json();
    const domain = normaliseDomain(rawDomain || '');

    if (!domain) {
      return NextResponse.json({ error: 'Please enter a valid website domain' }, { status: 400 });
    }

    // Check count of currently monitored domains
    const countRow = await queryOne(
      'SELECT COUNT(*) as count FROM monitored_domains WHERE user_id = $1',
      [user.id]
    );
    const currentCount = parseInt(countRow?.count || '0', 10);

    const limit = PLAN_LIMITS[user.plan] || 1;
    if (currentCount >= limit) {
      return NextResponse.json(
        { error: `Limit exceeded. Your current ${user.plan} plan allows monitoring up to ${limit} domain(s). Please upgrade to add more.` },
        { status: 400 }
      );
    }

    // Generate unique verification token
    const token = 'scanvault-verify-' + crypto.randomBytes(16).toString('hex');

    // Insert domain (fails on UNIQUE constraint if already added by this user)
    try {
      await execute(
        'INSERT INTO monitored_domains (user_id, domain, verified, verification_token) VALUES (?, ?, FALSE, ?)',
        [user.id, domain, token]
      );
    } catch (dbErr: any) {
      if (dbErr.code === '23505') { // Unique violation in PG
        return NextResponse.json({ error: 'This domain is already on your monitoring list' }, { status: 400 });
      }
      throw dbErr;
    }

    return NextResponse.json({ success: true, message: `Domain "${domain}" added to monitoring`, token });
  } catch (err) {
    console.error('Add monitoring error:', err);
    return NextResponse.json({ error: 'Failed to add domain to monitoring' }, { status: 500 });
  }
}

// ── DELETE: Remove domain from monitoring ───────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const domain = req.nextUrl.searchParams.get('domain');
    if (!domain) {
      return NextResponse.json({ error: 'domain is required' }, { status: 400 });
    }

    const result = await execute(
      'DELETE FROM monitored_domains WHERE user_id = ? AND domain = ?',
      [user.id, domain.trim().toLowerCase()]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Domain not found in your monitoring list' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Domain removed from monitoring' });
  } catch (err) {
    console.error('Delete monitoring error:', err);
    return NextResponse.json({ error: 'Failed to remove domain from monitoring' }, { status: 500 });
  }
}
