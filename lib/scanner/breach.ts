import { Finding } from '@/types/scan';

export async function checkBreach(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    // HaveIBeenPwned domain search API — checks if any emails from this domain
    // have appeared in known data breaches
    const res = await fetch(
      `https://haveibeenpwned.com/api/v3/breacheddomain/${encodeURIComponent(domain)}`,
      {
        headers: {
          'User-Agent': 'CyberGH-Scanner/1.0 (security-audit; +https://cybergh.app)',
          'hibp-api-key': process.env.HIBP_API_KEY || '',
        },
        signal: controller.signal,
      }
    );

    if (res.status === 404) {
      // 404 means no breaches found
      findings.push({
        category: 'breach',
        severity: 'pass',
        title: 'No email addresses from your domain found in known data breaches',
        description: 'We checked HaveIBeenPwned\'s database of over 12 billion breached accounts and found no email addresses from your domain.',
        fix: '',
      });
    } else if (res.status === 200) {
      const breaches: string[] = await res.json();
      const count = breaches.length;

      findings.push({
        category: 'breach',
        severity: count > 5 ? 'high' : count > 2 ? 'medium' : 'low',
        title: `${count} known data breach${count === 1 ? '' : 'es'} involving your domain`,
        description: `Email addresses from ${domain} have appeared in ${count} known data breach${count === 1 ? '' : 'es'}: ${breaches.slice(0, 5).join(', ')}${count > 5 ? ` and ${count - 5} more` : ''}. This means staff or customer credentials may be compromised and reused on other platforms.`,
        fix: 'Ask all staff who use company email addresses to change their passwords immediately, especially if they reuse passwords across sites. Enable multi-factor authentication on all business accounts. Review the specific breaches at haveibeenpwned.com.',
        evidence: `Breaches: ${breaches.slice(0, 10).join(', ')}`,
      });
    } else if (res.status === 401) {
      // No API key configured — skip gracefully
      findings.push({
        category: 'breach',
        severity: 'info',
        title: 'Breach check not available',
        description: 'We could not complete the breach exposure check at this time.',
        fix: 'Manually check your business email domain at haveibeenpwned.com',
      });
    } else {
      findings.push({
        category: 'breach',
        severity: 'info',
        title: 'Breach check could not complete',
        description: 'We were unable to check your domain against breach databases right now. Try again later.',
        fix: 'Manually check at haveibeenpwned.com',
      });
    }
  } catch {
    findings.push({
      category: 'breach',
      severity: 'info',
      title: 'Breach database check skipped',
      description: 'We could not reach the breach database during this scan.',
      fix: 'Check manually at haveibeenpwned.com/domain-search',
    });
  } finally {
    clearTimeout(timeout);
  }

  return findings;
}
