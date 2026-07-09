import { NextResponse } from 'next/server';
import { ScanResult } from '@/types/scan';

export const dynamic = 'force-dynamic';

// Static demo result — shows when someone clicks "See a sample report"
// Uses a fictional domain so no real business is identified
const DEMO: ScanResult = {
  id: 'demo',
  domain: 'example-business.com.gh',
  score: 34,
  status: 'complete',
  summary: { critical: 2, high: 2, medium: 2, low: 1, info: 1, pass: 3 },
  created_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  findings: [
    {
      category: 'ssl', severity: 'critical',
      title: 'SSL certificate has expired',
      description: 'Your SSL certificate expired 12 days ago. Visitors see a security warning and many browsers block access entirely.',
      fix: 'Renew your SSL certificate immediately. If you use cPanel, there\'s a button to renew. Free certificates from Let\'s Encrypt renew automatically if configured correctly.',
      evidence: 'Expired: 23 Jun 2026',
    },
    {
      category: 'ports', severity: 'critical',
      title: 'MySQL Database port is open to the internet (port 3306)',
      description: 'Your MySQL database port is open to the public internet. Anyone can attempt to connect to your database directly, bypassing your website\'s login system entirely.',
      fix: 'Immediately close port 3306 to the public internet. Configure your firewall to only allow connections from your web server\'s IP. This should take less than 5 minutes to fix.',
      evidence: 'Port 3306 responded to connection attempt',
    },
    {
      category: 'headers', severity: 'high',
      title: 'Missing: HTTP Strict Transport Security (HSTS)',
      description: 'Without HSTS, attackers can intercept connections and redirect users to an insecure (HTTP) version of your site, even if you have SSL.',
      fix: 'Add this header to your server: Strict-Transport-Security: max-age=31536000; includeSubDomains',
      evidence: undefined,
    },
    {
      category: 'dns', severity: 'high',
      title: 'Missing DMARC record',
      description: 'Without DMARC, your domain can be used to send phishing emails impersonating your business to your customers.',
      fix: 'Add a TXT record at _dmarc.yourdomain.com: v=DMARC1; p=quarantine; rua=mailto:you@yourdomain.com',
      evidence: undefined,
    },
    {
      category: 'headers', severity: 'medium',
      title: 'Missing: Content Security Policy (CSP)',
      description: 'No Content Security Policy found. This makes your site more vulnerable to cross-site scripting (XSS) attacks.',
      fix: 'Add a Content-Security-Policy header. Start with: Content-Security-Policy: default-src \'self\'',
      evidence: undefined,
    },
    {
      category: 'cookies', severity: 'medium',
      title: 'Cookie missing "Secure" flag: session_id',
      description: 'This cookie can be transmitted over unencrypted HTTP connections, meaning it could be intercepted by an attacker.',
      fix: 'Add the "Secure" flag to all cookies: Set-Cookie: name=value; Secure; HttpOnly',
      evidence: 'session_id=abc123; Path=/',
    },
    {
      category: 'ports', severity: 'low',
      title: 'Alternative HTTP port is open to the internet (port 8080)',
      description: 'Port 8080 is open. This may be intentional, but it\'s worth checking what service is running there.',
      fix: 'Check what application is running on port 8080. If it\'s an admin interface, restrict access to specific IPs.',
      evidence: 'Port 8080 responded to connection attempt',
    },
    {
      category: 'breach', severity: 'info',
      title: 'Breach check not available',
      description: 'We could not complete the breach exposure check at this time.',
      fix: 'Check manually at haveibeenpwned.com/domain-search',
      evidence: undefined,
    },
    {
      category: 'paths', severity: 'pass',
      title: 'No common sensitive paths exposed',
      description: 'We checked 10 commonly targeted paths and found none of them publicly accessible.',
      fix: '',
      evidence: undefined,
    },
    {
      category: 'dns', severity: 'pass',
      title: 'SPF record is configured',
      description: 'Your domain has an SPF record to help prevent email spoofing.',
      fix: '',
      evidence: 'v=spf1 include:_spf.google.com ~all',
    },
    {
      category: 'headers', severity: 'pass',
      title: 'X-Frame-Options (Clickjacking Protection)',
      description: 'Clickjacking protection is in place.',
      fix: '',
      evidence: 'SAMEORIGIN',
    },
  ],
};

export async function GET() {
  return NextResponse.json({ result: DEMO });
}
