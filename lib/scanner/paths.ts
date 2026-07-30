import { Finding } from '@/types/scan';

interface PathCheck {
  path: string;
  severity: Finding['severity'];
  title: string;
  description: string;
  fix: string;
  cve?: string;
  regulation?: string;
}

const SENSITIVE_PATHS: PathCheck[] = [
  // ── Source Code & Version Control ──
  { path: '/.git/config', severity: 'critical', title: 'Git repository exposed (.git)', description: 'Your .git directory is publicly accessible. Attackers can download your entire source code, including hardcoded passwords, private keys, and business logic.', fix: 'Block access to the .git directory in your server configuration. In Nginx: "location ~ /\\.git { deny all; }". Consider whether any credentials were in your code history and rotate them.', cve: 'CVE-2018-11235 (Git Vulnerability)', regulation: 'Bank of Ghana CISD 2026 (Sec 5.2) | PCI-DSS Req 6.5' },
  { path: '/.svn/entries', severity: 'critical', title: 'SVN repository exposed (.svn)', description: 'Your Subversion (.svn) directory is publicly accessible, allowing attackers to download your raw source code.', fix: 'Block access to the .svn directory in your server configuration.', regulation: 'Bank of Ghana CISD 2026 (Sec 5.2)' },
  { path: '/.env', severity: 'critical', title: 'Environment file exposed (.env)', description: 'Your .env file is publicly accessible. This file typically contains database passwords, API keys, and other secrets. Anyone can read it and gain full access to your systems.', fix: 'Immediately block access to .env files in your server configuration. In Apache: add "Deny from all" in a .htaccess file. In Nginx: add "location ~ /\\.env { deny all; }". Also rotate any credentials that were in this file immediately.', cve: 'CVE-2023-XXXX (Secrets Leakage)', regulation: 'Ghana Act 843 | GDPR Art. 32 | PCI-DSS Req 3.2' },
  { path: '/.env.example', severity: 'low', title: 'Environment template exposed (.env.example)', description: 'Your .env.example file is accessible. While it usually doesn\'t contain real secrets, it reveals your technology stack and the names of the API services you use.', fix: 'Remove .env.example from your public directory.' },

  // ── Configuration & Backups ──
  { path: '/config.php', severity: 'critical', title: 'PHP config file exposed', description: 'A config.php file is publicly accessible. Configuration files typically contain database credentials and other sensitive settings.', fix: 'Move config.php outside your web root, or deny access to it in your server configuration.', cve: 'CVE-2023-XXXX (Config Leakage)', regulation: 'Bank of Ghana CISD 2026 | PCI-DSS Req 8.2' },
  { path: '/wp-config.php.bak', severity: 'critical', title: 'WordPress config backup exposed', description: 'A backup of your wp-config.php is readable. This reveals your database password in plain text.', fix: 'Delete the backup file immediately and change your database password.', regulation: 'Ghana Act 843 (Data Breach)' },
  { path: '/docker-compose.yml', severity: 'medium', title: 'Docker Compose file exposed', description: 'Your docker-compose.yml is accessible. It reveals your internal container architecture, database types, and sometimes environment variables.', fix: 'Block access to .yml files or move them out of the public HTML directory.', regulation: 'Bank of Ghana CISD 2026 (Sec 4.3)' },
  { path: '/package.json', severity: 'low', title: 'Node.js package.json exposed', description: 'Your package.json is public, revealing all your backend dependencies and their exact versions.', fix: 'Ensure your Node.js application is serving only the "public" or "build" folder, not the root directory.', regulation: 'OWASP Top 10 (A06:2021)' },
  { path: '/composer.json', severity: 'low', title: 'PHP composer.json exposed', description: 'Your composer.json is public, revealing your PHP dependencies and framework versions.', fix: 'Move composer.json outside the public web root.' },
  { path: '/backup.sql', severity: 'critical', title: 'Database SQL backup exposed', description: 'A raw database dump (backup.sql) was found in your public directory. This contains ALL your customer data, passwords, and site content.', fix: 'This is a severe data breach. Delete the file immediately and assess what data was exposed.', regulation: 'Ghana Act 843 | GDPR Art. 33 | PCI-DSS Req 3.4' },
  { path: '/backup.zip', severity: 'high', title: 'Website ZIP backup exposed', description: 'A compressed backup archive of your site is publicly downloadable.', fix: 'Move backup archives to a secure, private location off the web server.' },

  // ── Server Info & Diagnostics ──
  { path: '/phpinfo.php', severity: 'high', title: 'PHP Info page exposed (phpinfo.php)', description: 'A phpinfo script is running. It reveals highly detailed information about your server, PHP version, compiled modules, and internal file paths.', fix: 'Delete the phpinfo.php file. It should never be left on a production server.', regulation: 'Bank of Ghana CISD 2026 (Sec 5.2)' },
  { path: '/server-status', severity: 'medium', title: 'Apache server-status page exposed', description: 'Your Apache server status page is publicly accessible. It reveals internal server information, connected IPs, and running processes.', fix: 'Restrict access to /server-status to localhost only. In Apache config: "Require local".' },
  { path: '/.htaccess', severity: 'low', title: 'Apache .htaccess file exposed', description: 'Your .htaccess routing and security rules are readable by the public. (Usually Apache blocks this by default, meaning your server config is broken).', fix: 'Fix your Apache configuration to ensure files starting with ".ht" are denied.' },

  // ── Admin Panels & Logins ──
  { path: '/admin/', severity: 'low', title: 'Admin panel at common /admin/ path', description: 'Your admin panel is accessible at the standard /admin URL. While not a vulnerability on its own, it makes it easier for attackers to find and target your admin login.', fix: 'Consider moving your admin panel to a non-standard URL, and ensure it has strong password requirements and rate limiting enabled.' },
  { path: '/administrator/', severity: 'low', title: 'Joomla admin panel exposed', description: 'A Joomla /administrator/ panel was found. Attackers will brute-force this login page.', fix: 'Ensure strong passwords and 2FA are enforced for all Joomla administrators.' },
  { path: '/wp-login.php', severity: 'medium', title: 'WordPress admin login exposed', description: 'Your WordPress login page is openly accessible. This is the most commonly brute-forced page on the internet.', fix: 'Install a WordPress security plugin (Wordfence or iThemes Security) to limit login attempts and add 2-factor authentication. Consider moving the login to a custom URL.' },
  { path: '/xmlrpc.php', severity: 'medium', title: 'WordPress XML-RPC enabled', description: 'XML-RPC is an old WordPress feature commonly used in brute-force attacks. Most modern sites don\'t need it.', fix: 'Disable XML-RPC using a WordPress security plugin, or add a rule to your .htaccess: "deny from all" for /xmlrpc.php.', cve: 'CVE-2015-8562 (Brute Force)', regulation: 'Bank of Ghana CISD 2026 (Sec 4.1)' },
  { path: '/phpmyadmin/', severity: 'high', title: 'phpMyAdmin database manager exposed', description: 'phpMyAdmin (your database management tool) is publicly accessible. If an attacker guesses your database password, they have full access to all your data.', fix: 'Restrict phpMyAdmin access to your IP address only, or move it to a non-standard path. Ask your hosting provider for help.' },
  
  // ── Keys & Certificates ──
  { path: '/.ssh/id_rsa', severity: 'critical', title: 'SSH Private Key exposed', description: 'An SSH private key is readable on your web server! Attackers can use this to log directly into your servers or GitHub repositories.', fix: 'Delete the key immediately from the public web folder and revoke the key on any servers it had access to.', regulation: 'Bank of Ghana CISD 2026 | ISO 27001' },
  { path: '/id_rsa', severity: 'critical', title: 'SSH Private Key exposed', description: 'An SSH private key was found in your web root.', fix: 'Delete and revoke the key immediately.', regulation: 'Bank of Ghana CISD 2026' },

  // ── OS Files ──
  { path: '/.DS_Store', severity: 'low', title: 'macOS .DS_Store file exposed', description: 'A .DS_Store file (created by macOS) is publicly accessible. It reveals your directory structure and hidden file names.', fix: 'Delete any .DS_Store files from your server and add them to your .gitignore.' },
  
  // ── Logs ──
  { path: '/error_log', severity: 'medium', title: 'Server error log exposed', description: 'Your server error log is readable. Logs often contain sensitive stack traces, database queries, and sometimes user data.', fix: 'Block public access to log files in your server configuration.', regulation: 'Bank of Ghana CISD 2026 (Sec 6.1)' },
  { path: '/debug.log', severity: 'medium', title: 'Application debug log exposed', description: 'A debug.log file is exposed. This can leak highly sensitive application state and credentials.', fix: 'Disable debug logging in production or move the log file outside the web root.', regulation: 'Bank of Ghana CISD 2026 (Sec 6.1)' }
];

export async function checkPaths(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const base = `https://${domain}`;

  // Batch concurrent requests to avoid overwhelming the target server 
  // and triggering rate-limits or WAF blocks (Nikto-Lite approach).
  const BATCH_SIZE = 5;
  const exposed: PathCheck[] = [];

  for (let i = 0; i < SENSITIVE_PATHS.length; i += BATCH_SIZE) {
    const batch = SENSITIVE_PATHS.slice(i, i + BATCH_SIZE);
    
    const checks = batch.map(async (check) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${base}${check.path}`, {
          method: 'GET',
          redirect: 'manual', // Don't follow redirects to prevent false positives (e.g. 301 to home page)
          signal: controller.signal,
          headers: { 'User-Agent': 'ScanVault-NiktoLite/1.0 (+https://scanvault.app)' },
        });

        // 200 = exposed. Note: 403 means it exists but is blocked (safe).
        if (res.status === 200) {
          // Double check it's not just a soft 404 (custom 200 OK page for everything)
          const text = await res.text().catch(() => '');
          if (text.toLowerCase().includes('404 not found') || text.toLowerCase().includes('page not found')) {
            return null;
          }
          return { ...check };
        }
        return null;
      } catch {
        return null; // Timeout or network error on this path — skip it
      } finally {
        clearTimeout(timeout);
      }
    });

    const results = await Promise.all(checks);
    exposed.push(...(results.filter(Boolean) as PathCheck[]));
    
    // Add a tiny delay between batches to be polite to the target server
    if (i + BATCH_SIZE < SENSITIVE_PATHS.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  if (exposed.length === 0) {
    findings.push({
      category: 'paths',
      severity: 'pass',
      title: 'No sensitive files or directories exposed',
      description: `We ran a Nikto-style check for ${SENSITIVE_PATHS.length} highly sensitive files (e.g. .env, .git, backups) and found none of them publicly accessible. Excellent work.`,
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
        cve: p.cve,
        regulation: p.regulation,
      });
    }
  }

  return findings;
}
