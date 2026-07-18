import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  const { Resend } = require('resend');
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, business, service, message } = await req.json();

    if (!name || !email || !business || !service) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const resend = getResend();
    if (!resend) {
      console.log('Contact form email skipped — RESEND_API_KEY not set');
      return NextResponse.json({ error: 'Failed to send message. Please email us directly at hello@scanvault.app' }, { status: 500 });
    }

    // Send notification email to the ScanVault team
    await resend.emails.send({
      from: 'ScanVault <onboarding@resend.dev>',
      to: ['hello@scanvault.app'],
      replyTo: email,
      subject: `New enquiry: ${service} — ${business}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0A1628; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">New Contact Enquiry</h1>
            <p style="color: #9CA3AF; margin: 4px 0 0; font-size: 14px;">ScanVault — scanvault.app</p>
          </div>
          <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6B7280; font-size: 14px; width: 140px;">Name</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #111827;">${name}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Email</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #111827;"><a href="mailto:${email}" style="color: #0A1628;">${email}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Phone</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #111827;">${phone || 'Not provided'}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Business</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #111827;">${business}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Service</td><td style="padding: 8px 0; font-size: 14px;"><span style="background: #EFF6FF; color: #1D4ED8; padding: 2px 10px; border-radius: 20px; font-size: 13px; font-weight: 500;">${service}</span></td></tr>
            </table>
            ${message ? `
            <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="color: #6B7280; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
              <p style="color: #111827; font-size: 14px; margin: 0; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
            </div>` : ''}
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <a href="mailto:${email}" style="display: inline-block; background: #0A1628; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">Reply to ${name}</a>
            </div>
          </div>
        </div>
      `,
    });

    // Send confirmation email to the user
    await resend.emails.send({
      from: 'ScanVault <onboarding@resend.dev>',
      to: [email],
      subject: `We received your message — ScanVault`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0A1628; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Thanks, ${name.split(' ')[0]}!</h1>
            <p style="color: #9CA3AF; margin: 4px 0 0; font-size: 14px;">We've received your message</p>
          </div>
          <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi ${name.split(' ')[0]}, we received your enquiry about <strong>${service}</strong> for <strong>${business}</strong>.</p>
            <p style="color: #374151; font-size: 15px; line-height: 1.6;">We'll get back to you within 24 hours. In the meantime, you can:</p>
            <ul style="color: #374151; font-size: 14px; line-height: 2;">
              <li>Run a <a href="https://scanvault.app" style="color: #0A1628;">free security scan</a> on your website</li>
              <li>Check your <a href="https://scanvault.app/compliance" style="color: #0A1628;">Ghana compliance score</a></li>
            </ul>
            <p style="color: #6B7280; font-size: 13px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">ScanVault — Free Website Security Scanner for Ghanaian Businesses<br>scanvault.app</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Contact form error:', err);
    return NextResponse.json({ error: 'Failed to send message. Please email us directly at hello@scanvault.app' }, { status: 500 });
  }
}
