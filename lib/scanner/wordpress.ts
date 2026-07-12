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
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'CyberGH-Scanner/1.0 (security-audit; +https://cyber-gh.vercel.app)' },
    });
    clearTimeout(timer);
    return res;
  } catch {
    return null;
  }
}

function extractVersion(text: string): string | null {
  // Match "Stable tag: 6.4.2" or "Version: 6.4.2" patterns in readme files
  const match = text.match(/(?:stable tag|version):\s*([\d.]+)/i);
  return match ? match[1] : null;
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
  const isWordPress =
    homepageText.includes('wp-content') ||
    homepageText.includes('wp-includes') ||
    homepageText.includes('wordpress') ||
    (loginRes?.status === 200) ||
    (readmeRes?.status === 200);

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
  // Check generator meta tag in homepage
  const versionFromMeta = homepageText.match(/<meta\s+name="generator"\s+content="WordPress\s+([\d.]+)"/i);
  const versionFromRss  = null; // skip RSS check to keep it fast

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
  if (readmeRes?.status === 200) {
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
    const userCount = (usersText.match(/"slug"/g) || []).length;

    findings.push({
      category: 'wordpress',
      severity: 'high',
      title: `WordPress REST API exposes ${userCount} user account${userCount !== 1 ? 's' : ''}`,
      description: `Your WordPress REST API is revealing your site's usernames to anyone who visits ${base}/wp-json/wp/v2/users. Attackers use this to get valid usernames and then run automated password-guessing attacks against your login page.`,
      fix: 'Disable user enumeration via the REST API. Add this to your functions.php or use a security plugin:\nadd_filter(\'rest_endpoints\', function($endpoints) { unset($endpoints[\'/wp/v2/users\']); unset($endpoints[\'/wp/v2/users/(?P<id>[\\d]+))\']); return $endpoints; });',
      evidence: `${base}/wp-json/wp/v2/users — found ${userCount} user records`,
    });
  }

  // ── Step 4: XML-RPC enabled ───────────────────────────────
  const xmlrpcRes = await safeFetch(`${base}/xmlrpc.php`);
  if (xmlrpcRes?.status === 200 || xmlrpcRes?.status === 405) {
    findings.push({
      category: 'wordpress',
      severity: 'medium',
      title: 'WordPress XML-RPC is enabled',
      description: 'XML-RPC is an old WordPress feature commonly used to launch brute-force password attacks. Attackers can try thousands of password combinations in a single request using XML-RPC\'s multicall feature, bypassing normal login rate limits.',
      fix: 'Disable XML-RPC unless you specifically need it for a mobile app or Jetpack. Use a security plugin like Wordfence, or add this to .htaccess: <Files xmlrpc.php> Order Deny,Allow Deny from all </Files>',
      evidence: `${base}/xmlrpc.php returned HTTP ${xmlrpcRes?.status}`,
    });
  }

  // ── Step 5: wp-login.php exposed ─────────────────────────
  if (loginRes?.status === 200) {
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
        const version = extractVersion(text);
        return { slug: plugin.slug, version };
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
      return res?.status === 200 ? p.name : null;
    })
  );

  const foundSecurity = secResults.filter(Boolean);
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

  return findings;
}
