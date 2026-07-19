import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '@/lib/db';

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

export async function GET(req: NextRequest) {
  try {
    const authorized = await isAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parallel aggregate queries
    const [
      usersCount,
      scansCount,
      monitoredCount,
      avgScoreRow,
      recentScans,
      usersList,
      trafficLogs
    ] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM users'),
      queryOne('SELECT COUNT(*) as count FROM scans'),
      queryOne('SELECT COUNT(*) as count FROM monitored_domains'),
      queryOne("SELECT AVG(score) as avg FROM scans WHERE status = 'complete' AND score IS NOT NULL"),
      
      query(
        `SELECT s.id, s.domain, s.score, s.status, s.created_at, u.email as user_email
         FROM scans s
         LEFT JOIN users u ON s.user_id = u.id
         ORDER BY s.created_at DESC
         LIMIT 15`
      ),
      
      query(
        `SELECT id, email, name, company, plan, created_at
         FROM users
         ORDER BY created_at DESC
         LIMIT 30`
      ),

      query(
        `SELECT l.id, l.path, l.action, l.metadata, l.country, l.region, l.city, l.created_at, u.email as user_email
         FROM visitor_logs l
         LEFT JOIN users u ON l.user_id = u.id
         ORDER BY l.created_at DESC
         LIMIT 50`
      )
    ]);

    return NextResponse.json({
      metrics: {
        totalUsers: parseInt(usersCount?.count || '0', 10),
        totalScans: parseInt(scansCount?.count || '0', 10),
        totalMonitored: parseInt(monitoredCount?.count || '0', 10),
        avgScore: Math.round(parseFloat(avgScoreRow?.avg || '0')),
      },
      recentScans,
      users: usersList,
      traffic: trafficLogs
    });

  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
