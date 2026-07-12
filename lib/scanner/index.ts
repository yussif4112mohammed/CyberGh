import { checkSSL }       from './ssl';
import { checkHeaders }   from './headers';
import { checkPaths }     from './paths';
import { checkDNS }       from './dns';
import { checkPorts }     from './ports';
import { checkCookies }   from './cookies';
import { checkBreach }    from './breach';
import { checkWordPress } from './wordpress';
import { Finding, ScanResult } from '@/types/scan';
import { v4 as uuid } from 'uuid';

// Weight each severity level's impact on the final score
const SEVERITY_WEIGHTS = {
  critical: -25,
  high:     -12,
  medium:   -6,
  low:      -2,
  info:      0,
  pass:     +3,
};

function calculateScore(findings: Finding[]): number {
  let score = 100;
  for (const f of findings) {
    score += SEVERITY_WEIGHTS[f.severity] ?? 0;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function summarise(findings: Finding[]) {
  return {
    critical: findings.filter(f => f.severity === 'critical').length,
    high:     findings.filter(f => f.severity === 'high').length,
    medium:   findings.filter(f => f.severity === 'medium').length,
    low:      findings.filter(f => f.severity === 'low').length,
    info:     findings.filter(f => f.severity === 'info').length,
    pass:     findings.filter(f => f.severity === 'pass').length,
  };
}

export type CheckName = 'ssl' | 'headers' | 'paths' | 'dns' | 'ports' | 'cookies' | 'breach' | 'wordpress';

export interface ScanProgress {
  check: CheckName;
  label: string;
  status: 'pending' | 'running' | 'done';
}

export const CHECKS: { name: CheckName; label: string }[] = [
  { name: 'ssl',       label: 'SSL/TLS Certificate' },
  { name: 'headers',   label: 'Security Headers' },
  { name: 'paths',     label: 'Exposed Sensitive Files' },
  { name: 'dns',       label: 'Email Security (SPF/DMARC)' },
  { name: 'ports',     label: 'Open Port Exposure' },
  { name: 'cookies',   label: 'Cookie Security' },
  { name: 'breach',    label: 'Data Breach Exposure' },
  { name: 'wordpress', label: 'WordPress Security' },
];

export async function runScan(
  domain: string,
  onProgress?: (check: CheckName) => void
): Promise<ScanResult> {
  const scanId = uuid();
  const findings: Finding[] = [];

  // Run checks: SSL first (needed for others), then parallelise the rest
  onProgress?.('ssl');
  const sslFindings = await checkSSL(domain);
  findings.push(...sslFindings);

  // Run remaining checks in parallel for speed
  onProgress?.('headers');
  onProgress?.('paths');
  onProgress?.('dns');
  onProgress?.('ports');
  onProgress?.('cookies');
  onProgress?.('breach');
  onProgress?.('wordpress');

  const [headerF, pathF, dnsF, portF, cookieF, breachF, wpF] = await Promise.all([
    checkHeaders(domain),
    checkPaths(domain),
    checkDNS(domain),
    checkPorts(domain),
    checkCookies(domain),
    checkBreach(domain),
    checkWordPress(domain),
  ]);

  findings.push(...headerF, ...pathF, ...dnsF, ...portF, ...cookieF, ...breachF, ...wpF);

  // Sort: critical first, passes last
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4, pass: 5 };
  findings.sort((a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5));

  const score = calculateScore(findings);
  const summary = summarise(findings);
  const now = new Date().toISOString();

  return {
    id: scanId,
    domain,
    score,
    status: 'complete',
    findings,
    summary,
    created_at: now,
    completed_at: now,
  };
}
