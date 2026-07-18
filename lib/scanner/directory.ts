import { Finding } from '@/types/scan';

// Common directories that should never have listing enabled
const DIRECTORIES_TO_CHECK = [
  { path: '/',                    name: 'Root directory' },
  { path: '/uploads/',            name: 'Uploads directory' },
  { path: '/images/',             name: 'Images directory' },
  { path: '/files/',              name: 'Files directory' },
  { path: '/backup/',             name: 'Backup directory' },
  { path: '/wp-content/uploads/', name: 'WordPress uploads' },
  { path: '/wp-content/plugins/', name: 'WordPress plugins' },
  { path: '/wp-content/themes/',  name: 'WordPress themes' },
  { path: '/assets/',             name: 'Assets directory' },
  { path: '/static/',             name: 'Static files directory' },
  { path: '/media/',              name: 'Media directory' },
  { path: '/documents/',          name: 'Documents directory' },
  { path: '/downloads/',          name: 'Downloads directory' },
  { path: '/data/',               name: 'Data directory' },
  { path: '/logs/',               name: 'Logs directory' },
];

// Signatures that indicate directory listing is enabled
const LISTING_SIGNATURES = [
  'Index of /',
  'Index of /',
  'Directory listing for',
  'Parent Directory',
  '[To Parent Directory]',
  '<title>Index of',
  'Last modified</a>',
  'Directory listing',
];

function hasDirectoryListing(html: string): boolean {
  const lower = html.toLowerCase();
  return LISTING_SIGNATURES.some(sig => lower.includes(sig.toLowerCase()));
}

async function checkDirectory(base: string, path: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${base}${path}`, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'ScanVault-Scanner/1.0 (security-audit; +https://scanvault.app)',
      },
    });

    if (res.status !== 200) return false;

    const text = await res.text();
    return hasDirectoryListing(text);
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkDirectoryListing(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const base = `https://${domain}`;

  // Run all directory checks in parallel
  const results = await Promise.all(
    DIRECTORIES_TO_CHECK.map(async (dir) => {
      const exposed = await checkDirectory(base, dir.path);
      return exposed ? dir : null;
    })
  );

  const exposedDirs = results.filter(Boolean) as typeof DIRECTORIES_TO_CHECK;

  if (exposedDirs.length === 0) {
    findings.push({
      category: 'directory',
      severity: 'pass',
      title: 'No directory listing vulnerabilities found',
      description: `We checked ${DIRECTORIES_TO_CHECK.length} common directories and found none with directory listing enabled.`,
      fix: '',
    });
    return findings;
  }

  for (const dir of exposedDirs) {
    const isHighRisk = ['/backup/', '/logs/', '/data/', '/documents/'].includes(dir.path);
    const isWordPress = dir.path.includes('wp-content');

    findings.push({
      category: 'directory',
      severity: isHighRisk ? 'critical' : isWordPress ? 'medium' : 'high',
      title: `Directory listing enabled: ${dir.name}`,
      description: `The ${dir.name} (${base}${dir.path}) allows anyone to browse and download all files in that folder like a file manager. ${
        isHighRisk
          ? 'This folder often contains sensitive data including database dumps, log files with credentials, and customer data.'
          : isWordPress
          ? 'Attackers can use this to identify your installed plugins and themes, then target known vulnerabilities in those specific versions.'
          : 'Attackers can discover files you didn\'t intend to make public, including backup files, configuration files, and customer documents.'
      }`,
      fix: 'Disable directory listing on your web server. In Apache, add "Options -Indexes" to your .htaccess file or server config. In Nginx, remove "autoindex on" from your config. Alternatively, place an empty index.html file in each directory. Contact your hosting provider if you need help.',
      evidence: `${base}${dir.path} — directory listing is enabled`,
    });
  }

  return findings;
}
