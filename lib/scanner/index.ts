import { checkSSL }              from './ssl';
import { checkHeaders }          from './headers';
import { checkPaths }            from './paths';
import { checkDNS }              from './dns';
import { checkPorts }            from './ports';
import { checkCookies }          from './cookies';
import { checkBreach }           from './breach';
import { checkWordPress }        from './wordpress';
import { checkHttpRedirect }     from './redirect';
import { checkSubdomains }       from './subdomains';
import { checkDirectoryListing } from './directory';
import { Finding, ScanResult }   from '@/types/scan';
import { v4 as uuid }            from 'uuid';

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

export type CheckName = 'ssl' | 'headers' | 'paths' | 'dns' | 'ports' | 'cookies' | 'breach' | 'wordpress' | 'redirect' | 'subdomain' | 'directory';

export const CHECKS: { name: CheckName; label: string }[] = [
  { name: 'ssl',       label: 'SSL/TLS Certificate' },
  { name: 'headers',   label: 'Security Headers' },
  { name: 'paths',     label: 'Exposed Sensitive Files' },
  { name: 'dns',       label: 'Email Security (SPF/DMARC)' },
  { name: 'ports',     label: 'Open Port Exposure' },
  { name: 'cookies',   label: 'Cookie Security' },
  { name: 'breach',    label: 'Data Breach Exposure' },
  { name: 'wordpress', label: 'WordPress Security' },
  { name: 'redirect',  label: 'HTTP→HTTPS Redirect & Mixed Content' },
  { name: 'subdomain', label: 'Subdomain Takeover' },
  { name: 'directory', label: 'Directory Listing' },
];

interface LogItem {
  step_name: string;
  status: 'success' | 'failed';
  duration_ms: number;
  error_msg?: string;
}

async function runTimedCheck(
  name: string,
  checkFn: () => Promise<Finding[]>
): Promise<{ findings: Finding[]; log: LogItem }> {
  const start = Date.now();
  try {
    const findings = await checkFn();
    return {
      findings,
      log: {
        step_name: name,
        status: 'success',
        duration_ms: Date.now() - start,
      },
    };
  } catch (err: any) {
    return {
      findings: [],
      log: {
        step_name: name,
        status: 'failed',
        duration_ms: Date.now() - start,
        error_msg: err?.message || String(err),
      },
    };
  }
}

export async function runScan(
  domain: string,
  onProgress?: (check: CheckName) => void
): Promise<ScanResult> {
  const overallStart = Date.now();
  const scanId = uuid();
  const findings: Finding[] = [];
  const logs: LogItem[] = [];

  // Run checks: SSL first (needed for others)
  onProgress?.('ssl');
  const sslResult = await runTimedCheck('ssl', () => checkSSL(domain));
  findings.push(...sslResult.findings);
  logs.push(sslResult.log);

  // Run remaining checks in parallel for speed
  onProgress?.('headers');
  onProgress?.('paths');
  onProgress?.('dns');
  onProgress?.('ports');
  onProgress?.('cookies');
  onProgress?.('breach');
  onProgress?.('wordpress');
  onProgress?.('redirect');
  onProgress?.('subdomain');
  onProgress?.('directory');

  const parallelChecks = [
    runTimedCheck('headers', () => checkHeaders(domain)),
    runTimedCheck('paths', () => checkPaths(domain)),
    runTimedCheck('dns', () => checkDNS(domain)),
    runTimedCheck('ports', () => checkPorts(domain)),
    runTimedCheck('cookies', () => checkCookies(domain)),
    runTimedCheck('breach', () => checkBreach(domain)),
    runTimedCheck('wordpress', () => checkWordPress(domain)),
    runTimedCheck('redirect', () => checkHttpRedirect(domain)),
    runTimedCheck('subdomain', () => checkSubdomains(domain)),
    runTimedCheck('directory', () => checkDirectoryListing(domain)),
  ];

  const results = await Promise.all(parallelChecks);
  for (const r of results) {
    findings.push(...r.findings);
    logs.push(r.log);
  }

  // Sort: critical first, passes last
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4, pass: 5 };
  findings.sort((a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5));

  const score = calculateScore(findings);
  const summary = summarise(findings);
  const now = new Date().toISOString();
  const overallDuration = Date.now() - overallStart;

  return {
    id: scanId,
    domain,
    score,
    status: 'complete',
    findings,
    summary,
    created_at: now,
    completed_at: now,
    duration_ms: overallDuration,
    logs,
  };
}
