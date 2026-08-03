import * as net from 'net';
import { Finding } from '@/types/scan';

interface PortCheck {
  port: number;
  name: string;
  severity: Finding['severity'];
  description: string;
  fix: string;
}

const CRITICAL_PORTS: PortCheck[] = [
  {
    port: 3306, name: 'MySQL Database',
    severity: 'critical',
    description: 'Your MySQL database port is open to the public internet. Anyone can attempt to connect to your database directly, bypassing your website\'s login system entirely. This is one of the most dangerous misconfigurations for a business.',
    fix: 'Immediately close port 3306 to the public internet. Configure your firewall to only allow connections from your web server\'s IP. Contact your hosting provider — this should take less than 5 minutes to fix.',
  },
  {
    port: 5432, name: 'PostgreSQL Database',
    severity: 'critical',
    description: 'Your PostgreSQL database port is open to the public internet. Anyone can attempt to connect directly to your database.',
    fix: 'Close port 5432 on your firewall. Only allow connections from your application server\'s IP address.',
  },
  {
    port: 27017, name: 'MongoDB Database',
    severity: 'critical',
    description: 'Your MongoDB port is exposed to the internet. Many MongoDB breaches happen because of exactly this — thousands of databases have been wiped and held for ransom this way.',
    fix: 'Immediately restrict MongoDB to only accept connections from localhost or your application server. Add authentication if not already done.',
  },
  {
    port: 6379, name: 'Redis Cache',
    severity: 'critical',
    description: 'Your Redis server is exposed to the internet. Redis by default has no authentication, meaning anyone can read, write, or delete your cache data.',
    fix: 'Bind Redis to 127.0.0.1 only and enable AUTH (password protection). Never expose Redis directly to the internet.',
  },
  {
    port: 22, name: 'SSH',
    severity: 'medium',
    description: 'SSH (remote server access) is open on the standard port 22. This is commonly brute-forced — automated bots scan the internet for open port 22 and try thousands of passwords.',
    fix: 'Change SSH to a non-standard port, disable password authentication (use SSH keys instead), and consider restricting access to specific IP addresses using a firewall.',
  },
  {
    port: 21, name: 'FTP',
    severity: 'high',
    description: 'FTP is open on your server. FTP sends data including passwords in plain text — anyone on the same network can intercept them. FTP is considered obsolete and insecure.',
    fix: 'Switch from FTP to SFTP (Secure FTP) or FTPS. Contact your hosting provider for guidance. Close port 21 on your firewall.',
  },
  {
    port: 23, name: 'Telnet',
    severity: 'critical',
    description: 'Telnet is running on your server. Like FTP, Telnet sends everything including passwords in plain text. It was replaced by SSH decades ago and should never be open on a production server.',
    fix: 'Disable Telnet immediately. Use SSH instead for remote server access.',
  },
  {
    port: 8080, name: 'Alternative HTTP port',
    severity: 'low',
    description: 'Port 8080 (common alternative web/admin port) is open. This may be intentional, but it\'s worth checking what service is running there.',
    fix: 'Check what application is running on port 8080. If it\'s an admin interface, ensure it requires authentication and consider restricting access to specific IPs.',
  },
];

export async function checkPorts(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`https://api.hackertarget.com/nmap/?q=${encodeURIComponent(domain)}`, {
      headers: { 'User-Agent': 'ScanVault-Scanner/1.0' },
      signal: controller.signal,
    });
    
    if (!res.ok) throw new Error('API Error');
    const text = await res.text();
    
    // Check if HackerTarget rate limited us
    if (text.includes('API count exceeded') || text.includes('error')) {
      throw new Error('Rate limited');
    }

    const openPorts: PortCheck[] = [];
    const lines = text.split('\n');
    
    for (const check of CRITICAL_PORTS) {
      // Look for a line like "3306/tcp open mysql"
      const portRegex = new RegExp(`^${check.port}\\/tcp\\s+open`, 'i');
      if (lines.some(line => portRegex.test(line))) {
        openPorts.push(check);
      }
    }

    for (const check of openPorts) {
      findings.push({
        category: 'ports',
        severity: check.severity,
        title: `${check.name} port is open to the internet (port ${check.port})`,
        description: check.description,
        fix: check.fix,
        evidence: `HackerTarget Nmap scan detected port ${check.port}/tcp as OPEN`,
      });
    }

    if (openPorts.length === 0) {
      findings.push({
        category: 'ports',
        severity: 'pass',
        title: 'No critical ports exposed to the internet',
        description: 'We checked commonly targeted ports and found none of them publicly accessible.',
        fix: '',
      });
    }

  } catch (err) {
    // If the API fails (rate limits, timeouts), degrade gracefully
    findings.push({
      category: 'ports',
      severity: 'info',
      title: 'Port scan could not complete',
      description: 'The port scanning service is temporarily unavailable or blocked.',
      fix: 'Manually verify your firewall rules to ensure database ports (3306, 5432, 27017) are closed to the public.',
    });
  } finally {
    clearTimeout(timeout);
  }

  return findings;
}
