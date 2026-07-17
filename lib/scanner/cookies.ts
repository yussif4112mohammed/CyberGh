import { Finding } from '@/types/scan';

export async function checkCookies(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {

    const res = await fetch(`https://${domain}`, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'CyberGH-Scanner/1.0 (security-audit; +https://cybergh.app)' },
    });

    // Next.js and other frameworks use getSetCookie — headers.raw() not available in all envs
    const cookieHeader = res.headers.get('set-cookie');

    if (!cookieHeader) {
      findings.push({
        category: 'cookies',
        severity: 'info',
        title: 'No cookies set on homepage',
        description: 'Your homepage doesn\'t set any cookies. This is common for simple sites. Cookies are typically set after login — check your authenticated pages.',
        fix: '',
      });
      return findings;
    }

    // Parse individual cookies (cookies are comma-separated, but commas in dates are tricky)
    const cookies = cookieHeader.split(/,(?=[^;]+=[^;]+)/);

    let hasInsecureCookie = false;
    let missingHttpOnly = false;
    let missingSameSite = false;

    for (const cookie of cookies) {
      const lower = cookie.toLowerCase();
      const name = cookie.split('=')[0].trim();

      if (!lower.includes('secure')) {
        hasInsecureCookie = true;
        findings.push({
          category: 'cookies',
          severity: 'medium',
          title: `Cookie missing "Secure" flag: ${name}`,
          description: 'This cookie can be transmitted over unencrypted HTTP connections, meaning it could be intercepted by an attacker on the same network. Session cookies sent over HTTP can be stolen to hijack user accounts.',
          fix: 'Add the "Secure" flag to all cookies, especially session cookies: Set-Cookie: name=value; Secure; HttpOnly',
          evidence: cookie.substring(0, 100),
        });
      }

      if (!lower.includes('httponly')) {
        missingHttpOnly = true;
        findings.push({
          category: 'cookies',
          severity: 'medium',
          title: `Cookie missing "HttpOnly" flag: ${name}`,
          description: 'This cookie can be accessed by JavaScript. If your site has an XSS vulnerability, attackers can use JavaScript to steal this cookie and hijack user sessions.',
          fix: 'Add HttpOnly to all session and authentication cookies: Set-Cookie: name=value; HttpOnly; Secure',
          evidence: cookie.substring(0, 100),
        });
      }

      if (!lower.includes('samesite')) {
        missingSameSite = true;
        findings.push({
          category: 'cookies',
          severity: 'low',
          title: `Cookie missing "SameSite" attribute: ${name}`,
          description: 'Without SameSite, this cookie is sent with cross-site requests, making it vulnerable to CSRF (Cross-Site Request Forgery) attacks.',
          fix: 'Add SameSite=Lax or SameSite=Strict to your cookies: Set-Cookie: name=value; SameSite=Lax; Secure; HttpOnly',
          evidence: cookie.substring(0, 100),
        });
      }
    }

    if (!hasInsecureCookie && !missingHttpOnly && !missingSameSite) {
      findings.push({
        category: 'cookies',
        severity: 'pass',
        title: 'Cookies have proper security flags',
        description: 'Your cookies are configured with Secure, HttpOnly, and SameSite flags.',
        fix: '',
      });
    }

  } catch {
    // Skip silently — cookie check is supplementary
  } finally {
    clearTimeout(timeout);
  }

  return findings;
}
