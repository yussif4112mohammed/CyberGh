import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'scanvault_fallback_secret_key_123';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://scanvault-gh.vercel.app';

// Plan pricing in Pesewas (GHS 1.00 = 100 pesewas)
const PLAN_AMOUNTS: Record<string, number> = {
  starter: 25000, // GHS 250 / month
  pro: 60000,     // GHS 600 / month
};

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
      return NextResponse.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 });
    }

    const { plan } = await req.json();
    if (!plan || !['starter', 'pro'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const amount = PLAN_AMOUNTS[plan];
    if (!amount) {
      return NextResponse.json({ error: 'Pricing tier amount error' }, { status: 400 });
    }

    if (!PAYSTACK_SECRET_KEY) {
      console.error('Paystack initialization error: PAYSTACK_SECRET_KEY is missing');
      return NextResponse.json(
        { error: 'Payments are currently offline. Please contact administrator support.' },
        { status: 500 }
      );
    }

    // Call Paystack Transaction Initialize API
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount,
        callback_url: `${APP_URL}/dashboard`,
        metadata: {
          userId: user.id,
          plan: plan,
        },
      }),
    });

    const data = await paystackRes.json();
    if (!paystackRes.ok || !data.status) {
      console.error('Paystack API error:', data);
      return NextResponse.json({ error: data.message || 'Payment initialization failed' }, { status: 500 });
    }

    // Return the authorization_url to redirect the user
    return NextResponse.json({
      success: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });

  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
