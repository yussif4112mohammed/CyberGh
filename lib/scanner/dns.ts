import * as dns from 'dns/promises';
import { Finding } from '@/types/scan';

export async function checkDNS(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  // ── SPF ──────────────────────────────────────────────────────
  try {
    const txtRecords = await dns.resolveTxt(domain);
    const spfRecords = txtRecords
      .map(r => r.join(''))
      .filter(r => r.startsWith('v=spf1'));

    if (spfRecords.length === 0) {
      findings.push({
        category: 'dns',
        severity: 'high',
        title: 'Missing SPF record — your domain can be used for email spoofing',
        description: 'Without an SPF record, anyone can send emails pretending to be from your domain. Scammers can impersonate your business and phish your customers — and there\'s nothing you can do to stop it without this record.',
        fix: 'Add a TXT record to your DNS: v=spf1 include:_spf.google.com ~all (if using Google Workspace) or v=spf1 include:yourhostingprovider.com ~all. Ask your domain registrar how to add DNS records.',
      });
    } else if (spfRecords.length > 1) {
      findings.push({
        category: 'dns',
        severity: 'medium',
        title: 'Multiple SPF records found — only one is allowed',
        description: 'You have more than one SPF record. Having multiple SPF records causes email authentication to fail, which means your legitimate emails may be marked as spam.',
        fix: 'Combine all your SPF records into a single record. Delete the extras and keep only one v=spf1 record.',
        evidence: spfRecords.join(' | '),
      });
    } else {
      const spf = spfRecords[0];
      // Check for overly permissive +all
      if (spf.includes('+all')) {
        findings.push({
          category: 'dns',
          severity: 'high',
          title: 'SPF record uses "+all" — allows anyone to send as your domain',
          description: 'Your SPF record ends with "+all" which means any server in the world is allowed to send emails as your domain. This makes spoofing trivially easy.',
          fix: 'Change "+all" to "~all" (softfail) or "-all" (hard fail) at the end of your SPF record.',
          evidence: spf,
        });
      } else {
        findings.push({
          category: 'dns',
          severity: 'pass',
          title: 'SPF record is configured',
          description: 'Your domain has an SPF record to help prevent email spoofing.',
          fix: '',
          evidence: spf,
        });
      }
    }
  } catch {
    findings.push({
      category: 'dns',
      severity: 'info',
      title: 'Could not check SPF record',
      description: 'We were unable to look up DNS records for your domain.',
      fix: 'Make sure your domain is publicly registered and DNS is propagated.',
    });
  }

  // ── DMARC ────────────────────────────────────────────────────
  try {
    const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
    const dmarc = dmarcRecords
      .map(r => r.join(''))
      .find(r => r.startsWith('v=DMARC1'));

    if (!dmarc) {
      findings.push({
        category: 'dns',
        severity: 'high',
        title: 'Missing DMARC record',
        description: 'Without DMARC, even if you have SPF set up, email spoofing is still possible. DMARC tells email providers what to do when a suspicious email claiming to be from you is detected.',
        fix: 'Add a TXT record at _dmarc.yourdomain.com: v=DMARC1; p=quarantine; rua=mailto:youremail@yourdomain.com. Start with p=none to monitor, then move to p=quarantine.',
      });
    } else {
      const policy = dmarc.match(/p=(\w+)/)?.[1];
      if (policy === 'none') {
        findings.push({
          category: 'dns',
          severity: 'medium',
          title: 'DMARC policy is set to "none" (monitoring only)',
          description: 'Your DMARC record exists but is in monitor mode (p=none). This means suspicious emails are not being blocked or quarantined — just reported.',
          fix: 'Once you\'ve confirmed your legitimate emails are passing DMARC checks, change p=none to p=quarantine or p=reject for stronger protection.',
          evidence: dmarc,
        });
      } else {
        findings.push({
          category: 'dns',
          severity: 'pass',
          title: `DMARC policy is "${policy}"`,
          description: 'Your domain has a DMARC policy that helps protect against email spoofing.',
          fix: '',
          evidence: dmarc,
        });
      }
    }
  } catch {
    findings.push({
      category: 'dns',
      severity: 'high',
      title: 'Missing DMARC record',
      description: 'No DMARC record was found for your domain. Without DMARC, your domain can be used to send phishing emails impersonating your business.',
      fix: 'Add a TXT record at _dmarc.yourdomain.com: v=DMARC1; p=quarantine; rua=mailto:youremail@yourdomain.com',
    });
  }

  return findings;
}
