import { Finding } from '@/types/scan';

interface HeaderCheck {
  header: string;
  severity: Finding['severity'];
  title: string;
  missing_description: string;
  present_description: string;
  fix: string;
  recommended?: string;
  validate?: (value: string) => { ok: boolean; note?: string };
}

const HEADER_CHECKS: HeaderCheck[] = [
  {
    header: 'strict-transport-security',
    severity: 'high',
    title: 'HTTP Strict Transport Security (HSTS)',
    missing_description: 'HSTS is missing. Without it, attackers can intercept connections and redirect users to an insecure (HTTP) version of your site, even if you have SSL.',
    present_description: 'HSTS is enabled — browsers will always use HTTPS for your site.',
    fix: 'Add this header to your server: Strict-Transport-Security: max-age=31536000; includeSubDomains. Ask your hosting provider or developer to add it.',
    recommended: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    validate: (v) => ({
      ok: v.includes('max-age') && parseInt(v.match(/max-age=(\d+)/)?.[1] || '0') >= 31536000,
      note: 'max-age should be at least 31536000 (1 year)',
    }),
  },
  {
    header: 'content-security-policy',
    severity: 'medium',
    title: 'Content Security Policy (CSP)',
    missing_description: 'No Content Security Policy found. This makes your site more vulnerable to cross-site scripting (XSS) attacks — where attackers inject malicious scripts into your pages.',
    present_description: 'Content Security Policy is set.',
    fix: 'Add a Content-Security-Policy header to your server. Start with: Content-Security-Policy: default-src \'self\'. This tells browsers to only load resources from your own domain.',
    recommended: 'Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:; font-src \'self\' https:; connect-src \'self\'',
    validate: (v) => {
      if (v.includes('unsafe-inline') || v.includes('unsafe-eval')) return { ok: false, note: 'CSP contains unsafe directives (unsafe-inline or unsafe-eval)' };
      if (!v.includes('default-src')) return { ok: false, note: 'CSP is missing default-src directive' };
      if (v.includes('*')) return { ok: false, note: 'CSP allows all sources (*) — too permissive' };
      return { ok: true };
    },
  },
  {
    header: 'x-frame-options',
    severity: 'medium',
    title: 'X-Frame-Options (Clickjacking Protection)',
    missing_description: 'X-Frame-Options is missing. Without it, attackers can embed your site inside an invisible iframe and trick users into clicking things they didn\'t intend to (clickjacking).',
    present_description: 'Clickjacking protection is in place.',
    fix: 'Add this header: X-Frame-Options: SAMEORIGIN. This prevents your site from being embedded in other sites.',
    recommended: 'X-Frame-Options: SAMEORIGIN',
    validate: (v) => {
      const lower = v.toLowerCase();
      if (lower !== 'sameorigin' && lower !== 'deny') return { ok: false, note: 'X-Frame-Options should be SAMEORIGIN or DENY' };
      return { ok: true };
    },
  },
  {
    header: 'x-content-type-options',
    severity: 'low',
    title: 'X-Content-Type-Options (MIME Sniffing Protection)',
    missing_description: 'X-Content-Type-Options is missing. Browsers may try to "guess" the type of files you serve, which can be exploited to execute malicious scripts.',
    present_description: 'MIME type sniffing protection is in place.',
    fix: 'Add this header: X-Content-Type-Options: nosniff',
    recommended: 'X-Content-Type-Options: nosniff',
    validate: (v) => {
      if (v.toLowerCase() !== 'nosniff') return { ok: false, note: 'X-Content-Type-Options should be exactly: nosniff' };
      return { ok: true };
    },
  },
  {
    header: 'referrer-policy',
    severity: 'low',
    title: 'Referrer Policy',
    missing_description: 'No Referrer-Policy set. When users click links on your site, your full URL (including any sensitive query parameters) is sent to the destination site.',
    present_description: 'Referrer policy is configured.',
    fix: 'Add this header: Referrer-Policy: strict-origin-when-cross-origin',
    recommended: 'Referrer-Policy: strict-origin-when-cross-origin',
    validate: (v) => {
      const lower = v.toLowerCase();
      if (lower === 'unsafe-url' || lower === 'no-referrer-when-downgrade') return { ok: false, note: 'Referrer policy leaks full URL to third parties' };
      return { ok: true };
    },
  },
  {
    header: 'permissions-policy',
    severity: 'info',
    title: 'Permissions Policy',
    missing_description: 'No Permissions-Policy header found. This header lets you control which browser features (camera, microphone, location) your site can use.',
    present_description: 'Permissions policy is configured.',
    fix: 'Add: Permissions-Policy: geolocation=(), microphone=(), camera=() to restrict unnecessary browser feature access.',
    recommended: 'Permissions-Policy: geolocation=(), microphone=(), camera=()',
  },
];

export async function checkHeaders(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`https://${domain}`, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'CyberGH-Scanner/1.0 (security-audit; +https://cybergh.app)' },
    });

    const headers = res.headers;

    for (const check of HEADER_CHECKS) {
      const value = headers.get(check.header);
      if (!value) {
        findings.push({
          category: 'headers',
          severity: check.severity,
          title: `Missing: ${check.title}`,
          description: check.missing_description,
          fix: check.fix,
          evidence: check.recommended ? `[RECOMMENDED: ${check.recommended}]` : undefined,
        });
      } else {
        // If there's a validator, run it
        if (check.validate) {
          const { ok, note } = check.validate(value);
          if (!ok) {
            findings.push({
              category: 'headers',
              severity: check.severity === 'high' ? 'medium' : 'low',
              title: `Weak configuration: ${check.title}`,
              description: `${check.title} is present but misconfigured. ${note || ''}`,
              fix: check.fix,
              evidence: check.recommended ? `[DETECTED: ${value}]\n[RECOMMENDED: ${check.recommended}]` : `[DETECTED: ${value}]`,
            });
            continue;
          }
        }
        findings.push({
          category: 'headers',
          severity: 'pass',
          title: check.title,
          description: check.present_description,
          fix: '',
          evidence: value,
        });
      }
    }

    // Check for server version leakage
    const server = headers.get('server');
    const powered = headers.get('x-powered-by');
    if (server && /[\d.]+/.test(server)) {
      findings.push({
        category: 'leakage',
        severity: 'low',
        title: 'Server version exposed in response headers',
        description: `Your server is advertising its software and version number (${server}). Attackers use this to look up known vulnerabilities for that specific version.`,
        fix: 'Configure your web server to hide its version. In Apache: ServerTokens Prod. In Nginx: server_tokens off. Ask your hosting provider if unsure.',
        evidence: `Server: ${server}`,
      });
    }
    if (powered) {
      findings.push({
        category: 'leakage',
        severity: 'low',
        title: 'Technology stack exposed (X-Powered-By header)',
        description: `Your server is broadcasting what technology it runs on (${powered}). This helps attackers target specific known vulnerabilities.`,
        fix: 'Remove the X-Powered-By header. In Express.js: app.disable("x-powered-by"). In PHP: expose_php = Off in php.ini.',
        evidence: `X-Powered-By: ${powered}`,
      });
    }

  } catch (err: any) {
    if (err.name === 'AbortError') {
      findings.push({
        category: 'headers',
        severity: 'high',
        title: 'Could not reach your website',
        description: 'The scan timed out trying to reach your site over HTTPS. Your server may be slow, down, or blocking automated requests.',
        fix: 'Check that your website is publicly accessible. Try opening it in a browser from a different network.',
      });
    } else {
      findings.push({
        category: 'headers',
        severity: 'info',
        title: 'Header scan incomplete',
        description: 'We encountered an issue checking your security headers.',
        fix: 'Make sure your domain is accessible and try again.',
        evidence: err.message,
      });
    }
  } finally {
    clearTimeout(timeout);
  }

  return findings;
}
