import { Finding } from '@/types/scan';

interface PathCheck {
  path: string;
  severity: Finding['severity'];
  title: string;
  description: string;
  fix: string;
}

const SENSITIVE_PATHS: PathCheck[] = [
  { path: '/.env',             severity: 'critical', title: 'Environment file exposed (.env)',         description: 'Your .env file is publicly accessible. This file typically contains database passwords, API keys, and other secrets. Anyone can read it and gain full access to your systems.', fix: 'Immediately block access to .env files in your server configuration. In Apache: add "Deny from all" in a .htaccess file. In Nginx: add "location ~ /\\.env { deny all; }". Also rotate any credentials that were in this file immediately.' },
  { path: '/.git/config',      severity: 'critical', title: 'Git repository exposed (.git)',           description: 'Your .git directory is publicly accessible. Attackers can download your entire source code, including hardcoded passwords, private keys, and business logic.', fix: 'Block access to the .git directory in your server configuration. In Nginx: "location ~ /\\.git { deny all; }". Consider whether any credentials were in your code history and rotate them.' },
  { path: '/wp-login.php',     severity: 'medium',   title: 'WordPress admin login exposed',           description: 'Your WordPress login page is openly accessible. This is the most commonly brute-forced page on the internet.', fix: 'Install a WordPress security plugin (Wordfence or iThemes Security) to limit login attempts and add 2-factor authentication. Consider moving the login to a custom URL.' },
  { path: '/phpmyadmin',       severity: 'high',     title: 'phpMyAdmin database manager exposed',     description: 'phpMyAdmin (your database management tool) is publicly accessible. If an attacker guesses your database password, they have full access to all your data.', fix: 'Restrict phpMyAdmin access to your IP address only, or move it to a non-standard path. Ask your hosting provider for help.' },
  { path: '/admin',            severity: 'low',      title: 'Admin panel at common /admin path',       description: 'Your admin panel is accessible at the standard /admin URL. While not a vulnerability on its own, it makes it easier for attackers to find and target your admin login.', fix: 'Consider moving your admin panel to a non-standard URL, and ensure it has strong password requirements and rate limiting enabled.' },
  { path: '/backup',           severity: 'high',     title: 'Backup directory exposed',               description: 'A /backup directory is publicly accessible. Backup files often contain your full database including customer data, which is a major data protection violation.', fix: 'Move backup files outside your web root (the public folder), or block access to this directory in your server config.' },
  { path: '/config.php',       severity: 'critical', title: 'PHP config file exposed',                description: 'A config.php file is publicly accessible. Configuration files typically contain database credentials and other sensitive settings.', fix: 'Move config.php outside your web root, or deny access to it in your server configuration.' },
  { path: '/xmlrpc.php',       severity: 'medium',   title: 'WordPress XML-RPC enabled',             description: 'XML-RPC is an old WordPress feature commonly used in brute-force attacks. Most modern sites don\'t need it.', fix: 'Disable XML-RPC using a WordPress security plugin, or add a rule to your .htaccess: "deny from all" for /xmlrpc.php.' },
  { path: '/.DS_Store',        severity: 'low',      title: 'macOS .DS_Store file exposed',           description: 'A .DS_Store file (created by macOS) is publicly accessible. It reveals your directory structure and file names.', fix: 'Delete any .DS_Store files from your server and add them to your .gitignore to prevent future uploads.' },
  { path: '/server-status',    severity: 'medium',   title: 'Apache server-status page exposed',      description: 'Your Apache server status page is publicly accessible. It reveals internal server information, connected IPs, and running processes.', fix: 'Restrict access to /server-status to localhost only. In Apache config: "Require local".' },
];

export async function checkPaths(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const base = `https://${domain}`;

  const checks = SENSITIVE_PATHS.map(async (check) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${base}${check.path}`, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'CyberGH-Scanner/1.0 (security-audit; +https://cybergh.app)' },
      });

      // 200 = exposed, 403 = exists but blocked (still worth flagging for some), 404 = not found
      if (res.status === 200) {
        return { ...check };
      }
      return null;
    } catch {
      return null; // timeout or network error on this path — skip it
    } finally {
      clearTimeout(timeout);
    }
  });

  const results = await Promise.all(checks);
  const exposed = results.filter(Boolean) as PathCheck[];

  if (exposed.length === 0) {
    findings.push({
      category: 'paths',
      severity: 'pass',
      title: 'No common sensitive paths exposed',
      description: 'We checked 10 commonly targeted paths and found none of them publicly accessible.',
      fix: '',
    });
  } else {
    for (const p of exposed) {
      findings.push({
        category: 'paths',
        severity: p.severity,
        title: p.title,
        description: p.description,
        fix: p.fix,
        evidence: `Accessible at: https://${domain}${p.path}`,
      });
    }
  }

  return findings;
}
