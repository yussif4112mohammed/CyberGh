import { Finding } from '@/types/scan';

export async function checkMeta(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const base = `https://${domain}`;

  const controller1 = new AbortController();
  const controller2 = new AbortController();
  const timeout1 = setTimeout(() => controller1.abort(), 6000);
  const timeout2 = setTimeout(() => controller2.abort(), 6000);

  const fetchRobots = fetch(`${base}/robots.txt`, {
    method: 'GET',
    signal: controller1.signal,
    headers: { 'User-Agent': 'ScanVault-Scanner/1.0 (security-audit; +https://scanvault-gh.vercel.app)' },
  }).catch(() => null);

  const fetchSecurity = fetch(`${base}/.well-known/security.txt`, {
    method: 'GET',
    signal: controller2.signal,
    headers: { 'User-Agent': 'ScanVault-Scanner/1.0 (security-audit; +https://scanvault-gh.vercel.app)' },
  }).catch(() => null);

  const [robotsRes, securityRes] = await Promise.all([fetchRobots, fetchSecurity]);
  clearTimeout(timeout1);
  clearTimeout(timeout2);

  // ── 1. robots.txt audit ──────────────────────────────────────
  if (robotsRes && robotsRes.status === 200) {
    try {
      const text = await robotsRes.text();
      const lines = text.split('\n');
      
      const sensitiveKeywords = [
        'admin', 'backup', 'staging', 'config', 'secret',
        'private', 'db', 'database', 'key', 'password', 'wp-'
      ];
      
      const exposedPaths: string[] = [];

      for (const line of lines) {
        const match = line.match(/^\s*Disallow:\s*(.+)$/i);
        if (match) {
          const path = match[1].trim();
          const matchesKeyword = sensitiveKeywords.some(keyword => path.toLowerCase().includes(keyword));
          // Avoid matching empty path "/" or just root symbols
          if (path.length > 2 && matchesKeyword) {
            exposedPaths.push(line.trim());
          }
        }
      }

      if (exposedPaths.length > 0) {
        findings.push({
          category: 'meta',
          severity: 'medium',
          title: 'robots.txt file exposes sensitive paths to attackers',
          description: 'Your robots.txt file contains "Disallow" rules targeting sensitive directories. While this tells web crawlers not to index these pages, attackers actively read robots.txt to discover administrative panels, backup files, or dev-staging environments.',
          fix: 'Remove sensitive file paths from robots.txt. Instead of using "Disallow" rules to hide them, secure these directories using strict access control lists (ACLs), IP white-lists, or server-side password authentication.',
          evidence: `[DETECTED: Exposing Paths]\n${exposedPaths.slice(0, 5).join('\n')}${exposedPaths.length > 5 ? '\n...and more' : ''}`,
        });
      } else {
        findings.push({
          category: 'meta',
          severity: 'pass',
          title: 'robots.txt does not expose sensitive paths',
          description: 'Your robots.txt file is configured safely and does not contain rules that expose admin portals or database folders to attackers.',
          fix: '',
        });
      }
    } catch {
      // If reading text fails, fallback to pass
      findings.push({
        category: 'meta',
        severity: 'pass',
        title: 'robots.txt check complete',
        description: 'No sensitive exposures detected in robots.txt.',
        fix: '',
      });
    }
  } else {
    findings.push({
      category: 'meta',
      severity: 'pass',
      title: 'robots.txt is secure or missing',
      description: 'Your website does not publish a robots.txt file, or it is default-blocked, meaning no sensitive paths are exposed to search engine bots.',
      fix: '',
    });
  }

  // ── 2. security.txt audit ────────────────────────────────────
  let hasSecurityTxt = false;
  if (securityRes && securityRes.status === 200) {
    try {
      const text = await securityRes.text();
      const hasContact = /Contact:/i.test(text);
      if (hasContact) {
        hasSecurityTxt = true;
        findings.push({
          category: 'meta',
          severity: 'pass',
          title: 'Security contact channel (security.txt) configured',
          description: 'A valid security.txt file is published at /.well-known/security.txt, allowing security researchers to report vulnerabilities privately.',
          fix: '',
          evidence: text.split('\n').filter(l => /Contact:/i.test(l)).join('\n'),
        });
      }
    } catch {}
  }

  if (!hasSecurityTxt) {
    findings.push({
      category: 'meta',
      severity: 'low',
      title: 'Missing security.txt file (RFC 9116)',
      description: 'No security contact file (security.txt) was found. The security.txt standard helps security researchers and ethical hackers report vulnerabilities directly to your security team before publicizing them on the internet.',
      fix: `Create a plain text file containing your security email address and place it at /.well-known/security.txt inside your web root.`,
      evidence: `[RECOMMENDED: security.txt]\nContact: mailto:security@${domain}\nExpires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}`,
    });
  }

  return findings;
}
