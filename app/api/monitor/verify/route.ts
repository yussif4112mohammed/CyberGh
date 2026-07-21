import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import * as dns from 'dns/promises';
import { queryOne, execute } from '@/lib/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'scanvault_fallback_secret_key_123';

async function getAuthUser() {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = jwt.verify(sessionCookie, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) return null;

    return await queryOne(
      'SELECT id, email FROM users WHERE id = $1',
      [decoded.userId]
    );
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domainId } = await req.json();
    if (!domainId) {
      return NextResponse.json({ error: 'domainId is required' }, { status: 400 });
    }

    // 1️⃣ Fetch domain records
    const mon = await queryOne(
      'SELECT id, domain, verified, verification_token FROM monitored_domains WHERE id = $1 AND user_id = $2',
      [domainId, user.id]
    );

    if (!mon) {
      return NextResponse.json({ error: 'Domain not found in your monitored list' }, { status: 404 });
    }

    if (mon.verified) {
      return NextResponse.json({ success: true, message: 'Domain is already verified' });
    }

    const domain = mon.domain;
    const token = mon.verification_token;
    let isVerified = false;
    let detailMsg = '';

    // 2️⃣ Check Option A: File Upload Check
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const fileUrl = `https://${domain}/.well-known/scanvault.txt`;
      const res = await fetch(fileUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': 'ScanVault-Verification/1.0' },
      });

      if (res.status === 200) {
        const text = await res.text();
        if (text.includes(token)) {
          isVerified = true;
          detailMsg = 'Verified via file upload';
        }
      }
    } catch (err) {
      // Ignored: fallback to DNS check
    } finally {
      clearTimeout(timeout);
    }

    // 3️⃣ Check Option B: DNS TXT Check (if file check failed)
    if (!isVerified) {
      try {
        const txtRecords = await dns.resolveTxt(domain);
        const matchToken = `scanvault-verification=${token}`;
        
        for (const record of txtRecords) {
          const content = record.join('');
          if (content.replace(/\s+/g, '').toLowerCase() === matchToken.replace(/\s+/g, '').toLowerCase()) {
            isVerified = true;
            detailMsg = 'Verified via DNS TXT record';
            break;
          }
        }
      } catch (err) {
        // DNS lookup failed
      }
    }

    // 4️⃣ Resolve status
    if (isVerified) {
      await execute(
        'UPDATE monitored_domains SET verified = TRUE WHERE id = $1',
        [domainId]
      );
      
      return NextResponse.json({
        success: true,
        message: 'Website verified successfully! Continuous monitoring is now active.',
        detail: detailMsg,
      });
    }

    return NextResponse.json(
      {
        error: 'Verification failed. We could not verify ownership. Make sure the file exists at /.well-known/scanvault.txt or your DNS TXT records are fully propagated.',
      },
      { status: 400 }
    );

  } catch (err: any) {
    console.error('Verify domain error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
