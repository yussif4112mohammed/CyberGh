import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'scanvault_fallback_secret_key_123';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'yussif4112@gmail.com').split(',').map(e => e.trim().toLowerCase());

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

    // Parallel aggregate queries for metrics & list tabs
    const [
      usersCount,
      scansCount,
      monitoredCount,
      avgScoreRow,
      recentScans,
      usersList,
      trafficLogs,
      
      // Funnel & Business Analytics aggregates
      uniqueVisitorsRow,
      scanningVisitorsRow,
      monitoredUsersRow,
      topScansRows,
      referrersRows,
      devicesRows,
      warmLeadsRows
    ] = await Promise.all([
      // Basic metrics
      queryOne('SELECT COUNT(*) as count FROM users'),
      queryOne('SELECT COUNT(*) as count FROM scans'),
      queryOne('SELECT COUNT(*) as count FROM monitored_domains'),
      queryOne("SELECT AVG(score) as avg FROM scans WHERE status = 'complete' AND score IS NOT NULL"),
      
      // Basic feeds
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
      ),

      // Business Insights & funnel metrics
      queryOne('SELECT COUNT(DISTINCT ip_address) as count FROM visitor_logs'),
      queryOne("SELECT COUNT(DISTINCT ip_address) as count FROM visitor_logs WHERE action = 'run_scan'"),
      queryOne('SELECT COUNT(DISTINCT user_id) as count FROM monitored_domains'),
      
      // Top Scanned domains
      query(
        `SELECT domain, COUNT(*) as scan_count, MAX(score) as max_score, MIN(score) as min_score
         FROM scans
         WHERE status = 'complete' AND score IS NOT NULL
         GROUP BY domain
         ORDER BY scan_count DESC
         LIMIT 10`
      ),

      // Referrers
      query(
        `SELECT COALESCE(metadata->>'referrer', 'Direct') as referrer_source, COUNT(*) as hits
         FROM visitor_logs
         WHERE action = 'view_page'
         GROUP BY referrer_source
         ORDER BY hits DESC
         LIMIT 10`
      ),

      // Device types
      query(
        `SELECT 
           CASE 
             WHEN user_agent ILIKE '%mobile%' OR user_agent ILIKE '%android%' OR user_agent ILIKE '%iphone%' OR user_agent ILIKE '%ipad%' THEN 'Mobile'
             ELSE 'Desktop'
           END as device_type,
           COUNT(*) as hits
         FROM visitor_logs
         WHERE user_agent IS NOT NULL
         GROUP BY device_type`
      ),

      // Warm Outreach Leads (unregistered scans with low score < 80)
      query(
        `SELECT s.id, s.domain, s.score, s.created_at,
           (SELECT country FROM visitor_logs WHERE ip_address = s.ip_address AND country IS NOT NULL ORDER BY created_at DESC LIMIT 1) as country,
           (SELECT city FROM visitor_logs WHERE ip_address = s.ip_address AND city IS NOT NULL ORDER BY created_at DESC LIMIT 1) as city
         FROM scans s
         WHERE s.user_id IS NULL AND s.status = 'complete' AND s.score < 80
         ORDER BY s.created_at DESC
         LIMIT 20`
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
      traffic: trafficLogs,
      business: {
        funnel: {
          visitors: parseInt(uniqueVisitorsRow?.count || '0', 10),
          scanners: parseInt(scanningVisitorsRow?.count || '0', 10),
          signups: parseInt(usersCount?.count || '0', 10),
          monitors: parseInt(monitoredUsersRow?.count || '0', 10),
        },
        topScanned: topScansRows,
        referrers: referrersRows.map((r: any) => ({
          source: r.referrer_source === '' || r.referrer_source === 'null' ? 'Direct' : r.referrer_source,
          hits: parseInt(r.hits, 10)
        })),
        devices: devicesRows,
        leads: warmLeadsRows
      }
    });

  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
