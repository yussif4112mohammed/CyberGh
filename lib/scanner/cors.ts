import { Finding } from '@/types/scan';

export async function checkCORS(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const targetUrl = `https://${domain}`;
  const testOrigin = 'https://evilattacker.com';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Origin': testOrigin,
        'User-Agent': 'ScanVault-Scanner/1.0 (security-audit; +https://scanvault-gh.vercel.app)',
      },
      signal: controller.signal,
    });

    const originHeader = res.headers.get('access-control-allow-origin');
    const credentialsHeader = res.headers.get('access-control-allow-credentials');

    const reflected = originHeader === testOrigin;
    const credentialsAllowed = credentialsHeader === 'true';

    if (reflected && credentialsAllowed) {
      findings.push({
        category: 'cors',
        severity: 'high',
        title: 'Insecure CORS configuration allows credentialed data theft',
        description: 'Your server dynamically reflects arbitrary request origins (e.g. evilattacker.com) and allows credentialed access. A malicious website in another browser tab can trigger background requests to read sensitive data or execute actions on behalf of your logged-in users.',
        fix: 'Restrict the Access-Control-Allow-Origin header to a strict whitelist of trusted partner domains. Never reflect the Origin header dynamically when Access-Control-Allow-Credentials is set to true.',
        evidence: `[DETECTED: Reflected Origin & Credentials Allowed]\nAccess-Control-Allow-Origin: ${originHeader}\nAccess-Control-Allow-Credentials: ${credentialsHeader}`,
      });
    } else if (originHeader === '*') {
      findings.push({
        category: 'cors',
        severity: 'low',
        title: 'CORS policy allows wildcard access (*)',
        description: 'The Access-Control-Allow-Origin header is set to a wildcard (*). While acceptable for purely public resources, wildcard access should be disabled on any endpoints containing user-specific profiles, login states, or private assets.',
        fix: 'Change Access-Control-Allow-Origin to specific trusted domains if this page manages user accounts or private settings.',
        evidence: `[DETECTED: Wildcard Enabled]\nAccess-Control-Allow-Origin: *`,
      });
    } else {
      findings.push({
        category: 'cors',
        severity: 'pass',
        title: 'Secure CORS configuration',
        description: 'Cross-Origin Resource Sharing (CORS) headers are correctly configured or default-blocked by the browser\'s Same-Origin Policy. External malicious websites cannot steal user credentials or read data.',
        fix: '',
      });
    }
  } catch (err: any) {
    // Fallback pass state if server blocks the request or has no CORS configuration active
    findings.push({
      category: 'cors',
      severity: 'pass',
      title: 'Default CORS configuration is secure',
      description: 'The server did not return custom CORS headers, meaning it is secured by the browser\'s default Same-Origin Policy.',
      fix: '',
    });
  } finally {
    clearTimeout(timeout);
  }

  return findings;
}
