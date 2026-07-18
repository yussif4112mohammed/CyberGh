import * as dns from 'dns/promises';
import { Finding } from '@/types/scan';

// Cloud services that are vulnerable to subdomain takeover when DNS points to them
// but no resource is actually claimed/deployed there
const TAKEOVER_SIGNATURES: Record<string, string> = {
  'amazonaws.com':           'No bucket found',
  'cloudfront.net':         'Bad request',
  'github.io':              "There isn't a GitHub Pages site here",
  'heroku.com':             'No such app',
  'netlify.app':            'Not found',
  'pantheon.io':            '404 error unknown site',
  'readme.io':              'Project doesnt exist',
  'surge.sh':               'project not found',
  'fastly.net':             'Fastly error',
  'shopify.com':            'Sorry, this shop is currently unavailable',
  'statuspage.io':          'You are being redirected',
  'zendesk.com':            'Help Center Closed',
  'desk.com':               'We couldn\'t find',
  'ghost.io':               'The thing you were looking for is no longer here',
  'tumblr.com':             'Whatever you were looking for doesn\'t currently exist',
  'bitbucket.io':           'Repository not found',
  'freshdesk.com':          'There is no helpdesk here',
  'helpjuice.com':          'We could not find what you\'re looking for',
  'unbounce.com':           'The requested URL was not found on this server',
};

// Common subdomains to check
const SUBDOMAINS_TO_CHECK = [
  'www', 'mail', 'blog', 'dev', 'staging', 'api',
  'admin', 'portal', 'app', 'support', 'help', 'shop',
];

async function getCNAME(hostname: string): Promise<string | null> {
  try {
    const records = await dns.resolveCname(hostname);
    return records[0] || null;
  } catch {
    return null;
  }
}

async function checkSubdomainTakeover(subdomain: string, domain: string): Promise<{ vulnerable: boolean; cname: string; service: string } | null> {
  const hostname = `${subdomain}.${domain}`;

  try {
    const cname = await getCNAME(hostname);
    if (!cname) return null;

    // Check if the CNAME points to a known cloud service
    const matchedService = Object.keys(TAKEOVER_SIGNATURES).find(service =>
      cname.includes(service)
    );

    if (!matchedService) return null;

    // Try to fetch the subdomain and look for the takeover signature
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`https://${hostname}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'ScanVault-Scanner/1.0 (security-audit; +https://scanvault.app)' },
      });
      const text = await res.text();
      const signature = TAKEOVER_SIGNATURES[matchedService].toLowerCase();

      if (text.toLowerCase().includes(signature)) {
        return { vulnerable: true, cname, service: matchedService };
      }
    } catch {
      // Can't reach the subdomain — might still be vulnerable but can't confirm
    } finally {
      clearTimeout(timeout);
    }

    return null;
  } catch {
    return null;
  }
}

export async function checkSubdomains(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  // Run all subdomain checks in parallel
  const results = await Promise.all(
    SUBDOMAINS_TO_CHECK.map(async (sub) => {
      const result = await checkSubdomainTakeover(sub, domain);
      return result ? { subdomain: sub, ...result } : null;
    })
  );

  const vulnerable = results.filter(Boolean) as Array<{
    subdomain: string;
    vulnerable: boolean;
    cname: string;
    service: string;
  }>;

  if (vulnerable.length > 0) {
    for (const v of vulnerable) {
      findings.push({
        category: 'subdomain',
        severity: 'critical',
        title: `Subdomain takeover risk: ${v.subdomain}.${domain}`,
        description: `Your subdomain ${v.subdomain}.${domain} has a DNS record pointing to ${v.service} (via CNAME: ${v.cname}), but no resource is actually claimed there. An attacker can register that unclaimed resource on ${v.service} and serve malicious content from your subdomain — phishing pages, malware downloads, or fake login pages that steal your customers' credentials.`,
        fix: `Either: 1) Remove the DNS CNAME record for ${v.subdomain}.${domain} if you no longer use that service, OR 2) Re-claim the resource on ${v.service} to prevent anyone else from taking it over. Contact your DNS provider to manage your records.`,
        evidence: `${v.subdomain}.${domain} → CNAME → ${v.cname} (unclaimed on ${v.service})`,
      });
    }
  } else {
    findings.push({
      category: 'subdomain',
      severity: 'pass',
      title: 'No subdomain takeover vulnerabilities detected',
      description: `We checked ${SUBDOMAINS_TO_CHECK.length} common subdomains and found no dangling DNS records pointing to unclaimed cloud services.`,
      fix: '',
    });
  }

  return findings;
}
