import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { execute } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ Read raw request body as text for signature verification
    const rawBody = await req.text();

    // 2️⃣ Verify HMAC signature
    const signature = req.headers.get('x-paystack-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
    }

    if (!PAYSTACK_SECRET_KEY) {
      console.error('Paystack webhook error: PAYSTACK_SECRET_KEY not set');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      console.warn('Paystack Webhook: Invalid Signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3️⃣ Parse event payload
    const payload = JSON.parse(rawBody);
    const event = payload.event;

    console.log(`Paystack Webhook: Received event "${event}"`);

    if (event === 'charge.success') {
      const data = payload.data;
      const metadata = data.metadata;
      const customer = data.customer;

      if (metadata && metadata.userId && metadata.plan) {
        const userId = parseInt(metadata.userId, 10);
        const plan = metadata.plan;
        const customerCode = customer?.customer_code || null;

        console.log(`Paystack Webhook: Upgrading User ID ${userId} to plan "${plan}"...`);

        // Update plan in users database
        await execute(
          `UPDATE users 
           SET plan = ?, paystack_customer_code = ?, subscription_status = ? 
           WHERE id = ?`,
          [plan, customerCode, 'active', userId]
        );

        // Track purchase action in visitor logs
        await execute(
          `INSERT INTO visitor_logs (ip_address, user_id, path, action, metadata)
           VALUES (?, ?, ?, ?, ?)`,
          ['127.0.0.1', userId, '/pricing', 'purchase_completed', JSON.stringify({ plan, reference: data.reference })]
        );

        console.log(`Paystack Webhook: User ID ${userId} upgraded successfully.`);
      } else {
        console.warn('Paystack Webhook: charge.success missing userId or plan metadata', metadata);
      }
    }

    // Always respond with 200 OK to acknowledge receipt
    return NextResponse.json({ received: true });

  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
  }
}
