import { Finding } from '@/types/scan';

export async function checkHttpRedirect(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 8000);

    // Try connecting over plain HTTP and see if it redirects to HTTPS
    const res = await fetch(`http://${domain}`, {
      method: 'GET',
      redirect: 'manual', // Don't follow redirects — we want to see what happens
      signal: controller.signal,
      headers: { 'User-Agent': 'CyberGH-Scanner/1.0 (security-audit; +https://cyber-gh.vercel.app)' },
    });

    const location = res.headers.get('location') || '';
    const isRedirectToHttps =
      (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) &&
      location.startsWith('https://');

    if (isRedirectToHttps) {
      // Check if it's a permanent redirect (301/308) — better for SEO + security
      if (res.status === 301 || res.status === 308) {
        findings.push({
          category: 'redirect',
          severity: 'pass',
          title: 'HTTP automatically redirects to HTTPS (permanent)',
          description: 'Your website correctly redirects all unencrypted HTTP traffic to HTTPS using a permanent redirect. This protects users who type your URL without "https://" and helps with search engine ranking.',
          fix: '',
          evidence: `HTTP ${res.status} → ${location}`,
        });
      } else {
        findings.push({
          category: 'redirect',
          severity: 'low',
          title: 'HTTP redirects to HTTPS but using a temporary redirect',
          description: 'Your site redirects HTTP to HTTPS, but uses a temporary redirect (302/307) instead of a permanent one (301). Temporary redirects don\'t tell browsers to remember the HTTPS preference, so users may still briefly connect over HTTP.',
          fix: 'Change your redirect from 302 to 301 (permanent redirect). In Apache: "Redirect permanent / https://yourdomain.com". In Nginx: "return 301 https://$host$request_uri;"',
          evidence: `HTTP ${res.status} → ${location}`,
        });
      }
    } else if (res.status >= 200 && res.status < 400 && !isRedirectToHttps) {
      findings.push({
        category: 'redirect',
        severity: 'high',
        title: 'HTTP version of site loads without redirecting to HTTPS',
        description: 'When someone visits your site using "http://" (without the "s"), they get the unencrypted version — no redirect to HTTPS happens. Any data they enter (passwords, form data, payment info) is sent in plain text over the internet.',
        fix: 'Set up a redirect from HTTP to HTTPS on your web server. In Apache, add to .htaccess: "RewriteEngine On / RewriteCond %{HTTPS} off / RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]". Contact your hosting provider if unsure.',
        evidence: `http://${domain} returned HTTP ${res.status} with no HTTPS redirect`,
      });
    }

    // ── Mixed content check ──────────────────────────────────
    // Fetch the HTTPS version and scan for HTTP resources
    const httpsController = new AbortController();
    setTimeout(() => httpsController.abort(), 8000);

    const httpsRes = await fetch(`https://${domain}`, {
      method: 'GET',
      redirect: 'follow',
      signal: httpsController.signal,
      headers: { 'User-Agent': 'CyberGH-Scanner/1.0 (security-audit; +https://cyber-gh.vercel.app)' },
    });

    const html = await httpsRes.text();

    // Look for HTTP resources loaded on the HTTPS page
    const httpResources: string[] = [];
    const patterns = [
      /src=["']http:\/\/([^"']+)["']/gi,
      /href=["']http:\/\/([^"']+\.(?:css|js))["']/gi,
      /url\(["']?http:\/\/([^"')]+)["']?\)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const resource = match[0].substring(0, 80);
        if (!httpResources.includes(resource)) {
          httpResources.push(resource);
        }
        if (httpResources.length >= 5) break; // cap at 5 examples
      }
    }

    if (httpResources.length > 0) {
      findings.push({
        category: 'redirect',
        severity: 'medium',
        title: `Mixed content detected — ${httpResources.length} HTTP resource${httpResources.length > 1 ? 's' : ''} loaded on HTTPS page`,
        description: 'Your HTTPS page loads some resources (images, scripts, or stylesheets) over unencrypted HTTP. This breaks your SSL protection — browsers show a "not fully secure" warning, and attackers can intercept and modify those HTTP resources even though your page uses HTTPS.',
        fix: 'Update all resource URLs to use "https://" instead of "http://". In WordPress, install the "Better Search Replace" plugin and replace all "http://yourdomain.com" with "https://yourdomain.com" in your database. Also check your theme and plugin settings.',
        evidence: httpResources.slice(0, 3).join(', '),
      });
    } else if (httpsRes.status === 200) {
      findings.push({
        category: 'redirect',
        severity: 'pass',
        title: 'No mixed content detected',
        description: 'All resources on your HTTPS page are loaded securely over HTTPS. No mixed content issues found.',
        fix: '',
      });
    }

  } catch (err: any) {
    if (err.name !== 'AbortError') {
      findings.push({
        category: 'redirect',
        severity: 'info',
        title: 'HTTP redirect check could not complete',
        description: 'We could not check your HTTP to HTTPS redirect configuration.',
        fix: 'Make sure your domain is publicly accessible and try again.',
        evidence: err.message,
      });
    }
  }

  return findings;
}
