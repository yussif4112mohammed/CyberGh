import { NextRequest, NextResponse } from 'next/server';
import { runScan } from '@/lib/scanner';
import { execute, query, queryOne } from '@/lib/db';
import { sendMonitoringAlertEmail } from '@/lib/email';
import { Finding } from '@/types/scan';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes max duration for serverless processing of multiple domains

const CRON_SECRET = process.env.CRON_SECRET || 'scanvault_fallback_cron_secret_key_2026';

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  try {
    // 1️⃣ Authenticate Cron trigger
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2️⃣ Fetch monitored domains due for rescan (verified, and scanned > 7 days ago, or never scanned)
    const monitoredList = await query(
      `SELECT m.id, m.domain, m.user_id, u.email as user_email
       FROM monitored_domains m
       JOIN users u ON m.user_id = u.id
       WHERE m.verified = TRUE AND (m.last_scan_at IS NULL OR m.last_scan_at < NOW() - INTERVAL '7 days')
       LIMIT 5` // limit 5 per batch run to stay safe from Vercel timeout limits
    );

    if (monitoredList.length === 0) {
      return NextResponse.json({ success: true, message: 'No domains due for rescan.' });
    }

    const results = [];

    for (const record of monitoredList) {
      const { domain, user_id, user_email } = record;
      try {
        console.log(`Cron: Scanning monitored domain "${domain}" for User ID ${user_id}...`);

        // Run security scan
        const scanResult = await runScan(domain);

        // Find the most recent complete scan for this domain before this run to compute delta
        const prevScan = await queryOne(
          `SELECT id, score FROM scans
           WHERE domain = $1 AND status = $2 AND user_id = $3
           ORDER BY created_at DESC LIMIT 1`,
          [domain, 'complete', user_id]
        );
        const previousScanId = prevScan?.id || null;
        const prevScore = prevScan?.score ?? null;

        // Save scan to database
        await execute(
          'INSERT INTO scans (id, domain, score, status, ip_address, duration_ms, previous_scan_id, user_id, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
          [scanResult.id, domain, scanResult.score, 'complete', '127.0.0.1', scanResult.duration_ms || null, previousScanId, user_id]
        );

        // Save findings
        if (scanResult.findings.length > 0) {
          const values = scanResult.findings.map(() => '(?,?,?,?,?,?,?)').join(',');
          const params = scanResult.findings.flatMap((f: Finding) => [
            scanResult.id, f.category, f.severity, f.title, f.description, f.fix || null, f.evidence || null
          ]);
          await execute(
            `INSERT INTO findings (scan_id, category, severity, title, description, fix, evidence) VALUES ${values}`,
            params
          );
        }

        // Save logs
        if (scanResult.logs && scanResult.logs.length > 0) {
          const logValues = scanResult.logs.map(() => '(?,?,?,?,?)').join(',');
          const logParams = scanResult.logs.flatMap((log: any) => [
            scanResult.id, log.step_name, log.status, log.duration_ms, log.error_msg || null
          ]);
          await execute(
            `INSERT INTO scan_logs (scan_id, step_name, status, duration_ms, error_msg) VALUES ${logValues}`,
            logParams
          );
        }

        // Update last scan timestamp in monitored_domains
        await execute(
          'UPDATE monitored_domains SET last_scan_at = NOW() WHERE id = ?',
          [record.id]
        );

        // If a previous scan exists, calculate differences and email the user
        let emailSent = false;
        if (prevScore !== null && previousScanId) {
          // Load previous findings
          const prevFindingsRows = await query(
            'SELECT title, severity FROM findings WHERE scan_id = $1 AND severity != $2',
            [previousScanId, 'pass']
          );
          const prevTitles = new Set(prevFindingsRows.map((f: any) => f.title));

          // Load current findings (non-pass)
          const currFindingsRows = scanResult.findings.filter((f: Finding) => f.severity !== 'pass');
          const currTitles = new Set(currFindingsRows.map((f: Finding) => f.title));

          // Compute new vs fixed findings
          const fixedIssues = prevFindingsRows
            .filter((f: any) => !currTitles.has(f.title))
            .map((f: any) => f.title);

          const newIssues = currFindingsRows
            .filter((f: Finding) => !prevTitles.has(f.title))
            .map((f: Finding) => f.title);

          const scoreDelta = scanResult.score - prevScore;

          // Only send email alert if there is a change in findings or score
          if (fixedIssues.length > 0 || newIssues.length > 0 || scoreDelta !== 0) {
            emailSent = await sendMonitoringAlertEmail(
              user_email,
              domain,
              scanResult.score,
              prevScore,
              scanResult.id,
              fixedIssues,
              newIssues
            );
          }
        }

        results.push({ domain, success: true, score: scanResult.score, emailSent });
      } catch (err: any) {
        console.error(`Cron: Failed to scan "${domain}":`, err);
        results.push({ domain, success: false, error: err.message || err });
      }
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (err: any) {
    console.error('Cron job error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
