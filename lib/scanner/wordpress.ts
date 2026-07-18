import { Finding } from '@/types/scan';

// Known vulnerable WordPress plugin signatures we can detect passively
// by checking if common plugin paths/files are accessible
const COMMON_PLUGINS = [
  { slug: 'contact-form-7',     path: '/wp-content/plugins/contact-form-7/readme.txt' },
  { slug: 'woocommerce',        path: '/wp-content/plugins/woocommerce/readme.txt' },
  { slug: 'yoast-seo',          path: '/wp-content/plugins/wordpress-seo/readme.txt' },
  { slug: 'elementor',          path: '/wp-content/plugins/elementor/readme.txt' },
  { slug: 'wpforms-lite',       path: '/wp-content/plugins/wpforms-lite/readme.txt' },
  { slug: 'akismet',            path: '/wp-content/plugins/akismet/readme.txt' },
  { slug: 'wordfence',          path: '/wp-content/plugins/wordfence/readme.txt' },
  { slug: 'really-simple-ssl',  path: '/wp-content/plugins/really-simple-ssl/readme.txt' },
  { slug: 'litespeed-cache',    path: '/wp-content/plugins/litespeed-cache/readme.txt' },
  { slug: 'wp-super-cache',     path: '/wp-content/plugins/wp-super-cache/readme.txt' },
];

async function safeFetch(url: string, timeout = 5000): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'ScanVault-Scanner/1.0 (security-audit; +https://scanvault.app)' },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractVersion(text: string): string | null {
  // Match "Stable tag: 6.4.2" or "Version: 6.4.2" patterns in readme files
  const match = text.match(/(?:stable tag|version):\s*([\d.]+)/i);
  return match ? match[1] : null;
}

function isValidReadme(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('contributors:') || lower.includes('stable tag:') || text.includes('===');
}

export async function checkWordPress(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const base = `https://${domain}`;

  // ── Step 1: Detect if WordPress is running ────────────────
  const [homepageRes, loginRes, readmeRes] = await Promise.all([
    safeFetch(base),
    safeFetch(`${base}/wp-login.php`),
    safeFetch(`${base}/readme.html`),
  ]);

  const homepageText = homepageRes ? await homepageRes.text().catch(() => '') : '';
  const loginText = loginRes ? await loginRes.text().catch(() => '') : '';
  const readmeText = readmeRes ? await readmeRes.text().catch(() => '') : '';

  // Check generator meta tag in homepage
  const versionFromMeta = homepageText.match(/<meta\s+name="generator"\s+content="WordPress\s+([\d.]+)"/i);

  const isWordPress =
    homepageText.includes('wp-content/') ||
    homepageText.includes('wp-includes/') ||
    versionFromMeta !== null ||
    (loginRes?.status === 200 && (loginText.includes('wp-submit') || loginText.includes('wp-login'))) ||
    (readmeRes?.status === 200 && readmeText.toLowerCase().includes('wordpress'));

  if (!isWordPress) {
    findings.push({
      category: 'wordpress',
      severity: 'pass',
      title: 'Not running WordPress',
      description: 'No WordPress installation detected on this domain.',
      fix: '',
    });
    return findings;
  }

  // It's WordPress — run all the checks
  findings.push({
    category: 'wordpress',
    severity: 'info',
    title: 'WordPress CMS detected',
    description: 'This website runs on WordPress. We\'ve run additional WordPress-specific security checks below.',
    fix: '',
  });

  // ── Step 2: WordPress version exposure ────────────────────
  if (versionFromMeta) {
    const version = versionFromMeta[1];
    findings.push({
      category: 'wordpress',
      severity: 'medium',
      title: `WordPress version exposed: ${version}`,
      description: `Your WordPress version (${version}) is visible in your page source code. Attackers use version numbers to look up known vulnerabilities for that specific release and target them directly.`,
      fix: 'Remove the WordPress version from your site\'s <head>. Add this to your theme\'s functions.php file: remove_action(\'wp_head\', \'wp_generator\'); Or use a security plugin like Wordfence or iThemes Security to do this automatically.',
      evidence: `<meta name="generator" content="WordPress ${version}">`,
    });
  }

  // Check readme.html which also leaks version
  if (readmeRes?.status === 200 && readmeText.toLowerCase().includes('wordpress')) {
    findings.push({
      category: 'wordpress',
      severity: 'medium',
      title: 'WordPress readme.html is publicly accessible',
      description: 'Your WordPress readme.html file is accessible to anyone. It contains your WordPress version number and other information that helps attackers fingerprint your installation.',
      fix: 'Delete the readme.html file from your WordPress root directory via FTP or your hosting file manager. Also delete license.txt and wp-config-sample.php.',
      evidence: `${base}/readme.html returned HTTP 200`,
    });
  }

  // ── Step 3: User enumeration via REST API ─────────────────
  const usersApiRes = await safeFetch(`${base}/wp-json/wp/v2/users`);
  if (usersApiRes?.status === 200) {
    let usersText = '';
    try { usersText = await usersApiRes.text(); } catch {}
    try {
      const usersJson = JSON.parse(usersText);
      if (Array.isArray(usersJson) && usersJson.length > 0 && usersJson[0].slug) {
        const userCount = usersJson.length;
        findings.push({
          category: 'wordpress',
          severity: 'high',
          title: `WordPress REST API exposes ${userCount} user account${userCount !== 1 ? 's' : ''}`,
          description: `Your WordPress REST API is revealing your site's usernames to anyone who visits ${base}/wp-json/wp/v2/users. Attackers use this to get valid usernames and then run automated password-guessing attacks against your login page.`,
          fix: 'Disable user enumeration via the REST API. Add this to your functions.php or use a security plugin:\nadd_filter(\'rest_endpoints\', function($endpoints) { unset($endpoints[\'/wp/v2/users\']); unset($endpoints[\'/wp/v2/users/(?P<id>[\\d]+))\']); return $endpoints; });',
          evidence: `${base}/wp-json/wp/v2/users — found ${userCount} user records`,
        });
      }
    } catch {
      // Ignore if not a valid JSON user array
    }
  }

  // ── Step 4: XML-RPC enabled ───────────────────────────────
  const xmlrpcRes = await safeFetch(`${base}/xmlrpc.php`);
  if (xmlrpcRes?.status === 200 || xmlrpcRes?.status === 405) {
    const xmlrpcText = await xmlrpcRes.text().catch(() => '');
    if (xmlrpcText.toLowerCase().includes('xml-rpc') || xmlrpcText.toLowerCase().includes('xmlrpc')) {
      findings.push({
        category: 'wordpress',
        severity: 'medium',
        title: 'WordPress XML-RPC is enabled',
        description: 'XML-RPC is an old WordPress feature commonly used to launch brute-force password attacks. Attackers can try thousands of password combinations in a single request using XML-RPC\'s multicall feature, bypassing normal login rate limits.',
        fix: 'Disable XML-RPC unless you specifically need it for a mobile app or Jetpack. Use a security plugin like Wordfence, or add this to .htaccess: <Files xmlrpc.php> Order Deny,Allow Deny from all </Files>',
        evidence: `${base}/xmlrpc.php returned HTTP ${xmlrpcRes?.status}`,
      });
    }
  }

  // ── Step 5: wp-login.php exposed ─────────────────────────
  if (loginRes?.status === 200 && (loginText.includes('wp-submit') || loginText.includes('wp-login'))) {
    findings.push({
      category: 'wordpress',
      severity: 'medium',
      title: 'WordPress login page at standard location',
      description: 'Your WordPress admin login page is at the standard /wp-login.php URL. Automated bots continuously scan for this URL and run brute-force password attacks against it.',
      fix: 'Install a security plugin (Wordfence, iThemes Security) to: 1) Add rate limiting to the login page, 2) Enable two-factor authentication, 3) Consider moving the login to a custom URL using the WPS Hide Login plugin.',
    });
  }

  // ── Step 6: wp-config.php accessible ─────────────────────
  const wpConfigRes = await safeFetch(`${base}/wp-config.php`);
  if (wpConfigRes?.status === 200) {
    const configText = await wpConfigRes.text().catch(() => '');
    if (configText.includes('DB_NAME') || configText.includes('DB_PASSWORD')) {
      findings.push({
        category: 'wordpress',
        severity: 'critical',
        title: 'wp-config.php is publicly accessible — database credentials exposed',
        description: 'Your WordPress configuration file (wp-config.php) is publicly readable. This file contains your database username, password, and secret keys. Anyone who reads it can take full control of your website and all customer data.',
        fix: 'This is a critical emergency. Immediately: 1) Change your database password, 2) Change all WordPress secret keys, 3) Contact your hosting provider to restrict access to wp-config.php, 4) Check your site for unauthorized changes.',
        evidence: 'wp-config.php returned HTTP 200 with database configuration content',
      });
    }
  }

  // ── Step 7: Directory listing on wp-content ───────────────
  const wpContentRes = await safeFetch(`${base}/wp-content/uploads/`);
  if (wpContentRes?.status === 200) {
    const contentText = await wpContentRes.text().catch(() => '');
    if (contentText.includes('Index of') || contentText.includes('Parent Directory')) {
      findings.push({
        category: 'wordpress',
        severity: 'medium',
        title: 'WordPress uploads directory has directory listing enabled',
        description: 'Your WordPress uploads folder is browseable — anyone can see and download all files you\'ve ever uploaded to your site, including private documents, images, and any personally identifiable data.',
        fix: 'Add an empty index.php file to your wp-content/uploads/ directory, or add "Options -Indexes" to an .htaccess file in that directory. Your hosting provider can help.',
        evidence: `${base}/wp-content/uploads/ — directory listing is enabled`,
      });
    }
  }

  // ── Step 8: Detect installed plugins ─────────────────────
  const pluginChecks = await Promise.all(
    COMMON_PLUGINS.map(async (plugin) => {
      const res = await safeFetch(`${base}${plugin.path}`);
      if (res?.status === 200) {
        const text = await res.text().catch(() => '');
        if (isValidReadme(text)) {
          const version = extractVersion(text);
          return { slug: plugin.slug, version };
        }
      }
      return null;
    })
  );

  const detectedPlugins = pluginChecks.filter(Boolean) as { slug: string; version: string | null }[];

  if (detectedPlugins.length > 0) {
    findings.push({
      category: 'wordpress',
      severity: 'low',
      title: `${detectedPlugins.length} WordPress plugin${detectedPlugins.length > 1 ? 's' : ''} detected`,
      description: `We detected the following plugins: ${detectedPlugins.map(p => `${p.slug}${p.version ? ` v${p.version}` : ''}`).join(', ')}. Plugin readme files being publicly accessible reveals your technology stack to attackers.`,
      fix: 'Regularly update all plugins to their latest versions. Remove plugins you\'re not actively using. Consider adding a rule to block access to readme.txt files in your wp-content/plugins directory.',
      evidence: detectedPlugins.map(p => `${p.slug}${p.version ? ` v${p.version}` : ''}`).join(', '),
    });
  }

  // ── Step 9: Check for security plugin ────────────────────
  const securityPlugins = [
    { name: 'Wordfence',       path: '/wp-content/plugins/wordfence/wordfence.php' },
    { name: 'iThemes Security', path: '/wp-content/plugins/better-wp-security/better-wp-security.php' },
    { name: 'Sucuri',          path: '/wp-content/plugins/sucuri-scanner/sucuri.php' },
    { name: 'All In One WP Security', path: '/wp-content/plugins/all-in-one-wp-security-and-firewall/wp-security.php' },
  ];

  const secResults = await Promise.all(
    securityPlugins.map(async (p) => {
      const res = await safeFetch(`${base}${p.path}`);
      if (res?.status === 200) {
        const text = await res.text().catch(() => '');
        if (!text.toLowerCase().includes('<!doctype') && !text.toLowerCase().includes('<html')) {
          return p.name;
        }
      }
      return null;
    })
  );

  const foundSecurity = secResults.filter(Boolean) as string[];
  if (foundSecurity.length === 0) {
    findings.push({
      category: 'wordpress',
      severity: 'high',
      title: 'No WordPress security plugin detected',
      description: 'We couldn\'t detect a security plugin on your WordPress site. Security plugins provide essential protection including login protection, malware scanning, firewall rules, and activity monitoring.',
      fix: 'Install a security plugin immediately. Wordfence is the most popular free option — it includes a firewall, malware scanner, and login protection. Install it from your WordPress admin under Plugins → Add New.',
    });
  } else {
    findings.push({
      category: 'wordpress',
      severity: 'pass',
      title: `Security plugin detected: ${foundSecurity.join(', ')}`,
      description: 'A WordPress security plugin is installed. This provides important baseline protection for your site.',
      fix: '',
      evidence: foundSecurity.join(', '),
    });
  }

  // ── Step 10: Author Archive Redirect Scanning ──────────────
  try {
    const authorRes = await fetch(`${base}/?author=1`, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'User-Agent': 'ScanVault-Scanner/1.0 (security-audit; +https://scanvault.app)' },
    });
    const location = authorRes.headers.get('location');
    if ((authorRes.status === 301 || authorRes.status === 302) && location && location.includes('/author/')) {
      const authorMatch = location.match(/\/author\/([^/]+)/);
      const username = authorMatch ? authorMatch[1] : 'discovered';
      findings.push({
        category: 'wordpress',
        severity: 'high',
        title: `WordPress user enumeration via author archives is enabled`,
        description: `Your website redirects author ID queries to their public username profile (e.g. /?author=1 redirects to /author/${username}/). This allows attackers to harvest usernames and perform brute-force password attacks.`,
        fix: 'Disable author archives or redirect them to the home page using a security plugin or by adding this to functions.php:\nadd_action(\'template_redirect\', function() { if (is_author()) { wp_safe_redirect(home_url()); exit; } });',
        evidence: `/?author=1 redirected to ${location}`,
      });
    }
  } catch {}

  // ── Step 11: Debug Log Leakage Check ───────────────────────
  const debugLogRes = await safeFetch(`${base}/wp-content/debug.log`);
  if (debugLogRes?.status === 200) {
    const logText = await debugLogRes.text().catch(() => '');
    if (logText.includes('PHP Notice') || logText.includes('PHP Warning') || logText.includes('PHP Fatal')) {
      findings.push({
        category: 'wordpress',
        severity: 'high',
        title: 'WordPress debug.log is publicly exposed',
        description: 'Your WordPress debug log file (debug.log) is public. It contains system error messages, database queries, plugin warnings, and potentially sensitive credentials or file paths.',
        fix: 'Disable WP_DEBUG_LOG in your wp-config.php, or restrict access to debug.log files using a .htaccess/Nginx rule: "deny all" for debug.log.',
        evidence: `${base}/wp-content/debug.log returned HTTP 200 containing PHP errors`,
      });
    }
  }

  // ── Step 12: Database Backup/Config Backups Exposure ───────
  const backupFiles = [
    'wp-config.php.bak',
    'wp-config.php.old',
    'wp-config.php.save',
    'wp-config.old',
    'wp-config.txt',
  ];
  const backupResults = await Promise.all(
    backupFiles.map(async (file) => {
      const res = await safeFetch(`${base}/${file}`);
      if (res?.status === 200) {
        const text = await res.text().catch(() => '');
        if (text.includes('DB_NAME') || text.includes('DB_PASSWORD') || text.includes('wp-config')) {
          return file;
        }
      }
      return null;
    })
  );
  const exposedBackups = backupResults.filter(Boolean) as string[];
  for (const file of exposedBackups) {
    findings.push({
      category: 'wordpress',
      severity: 'critical',
      title: `Exposed WordPress configuration backup: ${file}`,
      description: `An exposed backup of your WordPress configuration file was found at /${file}. Anyone can read this to steal database passwords, security keys, and take full control of your website.`,
      fix: `Immediately: 1) Delete the file /${file} from your server, 2) Change your database password, 3) Change all security keys in wp-config.php.`,
      evidence: `Accessible at: ${base}/${file}`,
    });
  }

  return findings;
}
