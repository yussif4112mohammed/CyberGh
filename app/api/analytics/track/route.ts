import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { execute } from '@/lib/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'scanvault_fallback_secret_key_123';

export async function POST(req: NextRequest) {
  try {
    const { action, path, metadata } = await req.json();

    if (!action || !path) {
      return NextResponse.json({ error: 'action and path are required' }, { status: 400 });
    }

    // Geolocation headers from Vercel
    const country = req.headers.get('x-vercel-ip-country') || null;
    const region = req.headers.get('x-vercel-ip-country-region') || null;
    const city = req.headers.get('x-vercel-ip-city') || null;
    const userAgent = req.headers.get('user-agent') || null;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    // Decode session token if available to link user
    let userId: number | null = null;
    try {
      const sessionCookie = cookies().get('session')?.value;
      if (sessionCookie) {
        const decoded = jwt.verify(sessionCookie, JWT_SECRET) as any;
        if (decoded && decoded.userId) {
          userId = decoded.userId;
        }
      }
    } catch {}

    // Save tracking log
    await execute(
      `INSERT INTO visitor_logs (ip_address, user_id, path, action, metadata, country, region, city, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ip,
        userId,
        path,
        action,
        metadata ? JSON.stringify(metadata) : null,
        country,
        region,
        city,
        userAgent,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Analytics tracking error:', err);
    return NextResponse.json({ error: 'Failed to record tracking action' }, { status: 500 });
  }
}
