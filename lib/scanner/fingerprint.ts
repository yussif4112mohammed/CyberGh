import { Finding } from '@/types/scan';

export async function checkFingerprint(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  try {
    const res = await fetch(`https://${domain}`, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'ScanVault-Scanner/1.0 (security-audit; +https://scanvault.app)' },
    });
    
    const headers = res.headers;
    const bodyText = await res.text().then(t => t.slice(0, 15000)).catch(() => '');
    
    const addFinding = (techName: string, description: string, evidence: string, severity: 'info' | 'low' = 'info', titlePrefix: string = 'Detected: ') => {
      findings.push({
        category: 'fingerprint',
        severity,
        title: `${titlePrefix}${techName}`,
        description,
        fix: '',
        evidence
      });
    };

    // CMS Detection
    const generator = headers.get('x-generator') || bodyText.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
    
    if (bodyText.includes('/wp-content/') || bodyText.includes('/wp-includes/') || /WordPress/i.test(generator)) {
      addFinding('WordPress CMS', 'Your website is built on WordPress. While WordPress is popular, it requires regular plugin and theme updates. Outdated WordPress installations are a top target for automated attacks.', 'Detected via HTML body content (/wp-content/ or generator)');
    } else if (bodyText.includes('/components/com_') || /Joomla/i.test(generator)) {
      addFinding('Joomla CMS', 'Your website is built on Joomla. Ensure that your core installation and all extensions are kept up-to-date.', 'Detected via HTML body content or generator meta tag');
    } else if (/Drupal/i.test(generator) || headers.get('X-Generator')?.includes('Drupal') || bodyText.includes('drupal.js') || bodyText.includes('sites/default/files')) {
      addFinding('Drupal CMS', 'Your website is built on Drupal. Ensure that your modules and core installation are kept up-to-date.', 'Detected via headers or HTML body content');
    } else if (bodyText.includes('cdn.shopify.com') || bodyText.includes('Shopify.shop')) {
      addFinding('Shopify', 'Your website is hosted on Shopify, a managed e-commerce platform.', 'Detected via HTML body content');
    } else if (bodyText.includes('static.wixstatic.com') || headers.has('X-Wix-Published-Version')) {
      addFinding('Wix', 'Your website is hosted on Wix, a managed website builder.', 'Detected via headers or HTML body content');
    } else if (bodyText.includes('static.squarespace.com') || bodyText.includes('squarespace-cdn.com')) {
      addFinding('Squarespace', 'Your website is hosted on Squarespace, a managed website builder.', 'Detected via HTML body content');
    } else if (bodyText.includes('ghost.io') || headers.has('X-Ghost-Cache-Status')) {
      addFinding('Ghost CMS', 'Your website is built on Ghost.', 'Detected via headers or HTML body content');
    }

    // Web Server
    const serverHeader = headers.get('server') || '';
    if (serverHeader) {
      if (/nginx/i.test(serverHeader)) {
        const versionMatch = serverHeader.match(/nginx\/([\d.]+)/i);
        if (versionMatch) {
          addFinding(`Nginx ${versionMatch[1]}`, 'Your server is exposing its exact Nginx version. This can help attackers identify specific vulnerabilities for this version. Consider hiding the server version.', `Server header: ${serverHeader}`, 'low', 'Server version exposed: ');
        } else {
          addFinding('Nginx', 'Your site is served by Nginx.', `Server header: ${serverHeader}`);
        }
      } else if (/apache/i.test(serverHeader)) {
        const versionMatch = serverHeader.match(/Apache\/([\d.]+)/i);
        if (versionMatch) {
          addFinding(`Apache ${versionMatch[1]}`, 'Your server is exposing its exact Apache version. This can help attackers identify specific vulnerabilities for this version. Consider hiding the server version.', `Server header: ${serverHeader}`, 'low', 'Server version exposed: ');
        } else {
          addFinding('Apache', 'Your site is served by Apache.', `Server header: ${serverHeader}`);
        }
      } else if (/iis/i.test(serverHeader)) {
        const versionMatch = serverHeader.match(/IIS\/([\d.]+)/i);
        if (versionMatch) {
          addFinding(`IIS ${versionMatch[1]}`, 'Your server is exposing its exact IIS version. Consider hiding the server version.', `Server header: ${serverHeader}`, 'low', 'Server version exposed: ');
        } else {
          addFinding('IIS', 'Your site is served by Microsoft IIS.', `Server header: ${serverHeader}`);
        }
      } else if (/litespeed/i.test(serverHeader)) {
        addFinding('LiteSpeed', 'Your site is served by LiteSpeed.', `Server header: ${serverHeader}`);
      } else if (/caddy/i.test(serverHeader)) {
        addFinding('Caddy', 'Your site is served by Caddy.', `Server header: ${serverHeader}`);
      }
    }

    // CDN/WAF Detection
    let isCloudflareAdded = false;
    if (/cloudflare/i.test(serverHeader) || headers.has('cf-ray')) {
      addFinding('Cloudflare CDN/WAF', 'Your site is protected by Cloudflare, which provides DDoS protection, WAF, and CDN capabilities. This is a security positive — Cloudflare blocks many common attacks automatically.', `CF-Ray header present or Server: ${serverHeader}`);
      isCloudflareAdded = true;
    }
    
    if (headers.get('x-served-by')?.includes('cache-') || headers.has('fastly-debug-path')) {
      addFinding('Fastly CDN', 'Your site uses Fastly CDN.', 'Detected via Fastly specific headers');
    }
    if (headers.has('x-check-cacheable') || serverHeader.includes('AkamaiGHost')) {
      addFinding('Akamai CDN', 'Your site uses Akamai CDN.', 'Detected via Akamai specific headers');
    }
    if (headers.has('x-varnish')) {
      addFinding('Varnish Cache', 'Your site uses Varnish Cache.', 'Detected via X-Varnish header');
    }
    if (headers.has('x-amz-cf-id')) {
      addFinding('AWS CloudFront', 'Your site uses AWS CloudFront CDN.', 'Detected via X-Amz-Cf-Id header');
    }
    if (headers.has('x-sucuri-id')) {
      addFinding('Sucuri WAF', 'Your site is protected by Sucuri WAF.', 'Detected via X-Sucuri-ID header');
    }

    // Framework / Language
    const xPoweredBy = headers.get('x-powered-by') || '';
    if (xPoweredBy.includes('PHP')) {
      addFinding('PHP', 'Your website is built with PHP.', `X-Powered-By: ${xPoweredBy}`);
    }
    if (xPoweredBy.includes('Express')) {
      addFinding('Node.js / Express', 'Your website is built with Node.js and Express.', `X-Powered-By: ${xPoweredBy}`);
    }
    if (xPoweredBy.includes('ASP.NET') || headers.has('x-aspnet-version')) {
      addFinding('ASP.NET', 'Your website is built with ASP.NET.', 'Detected via ASP.NET headers');
    }
    if (headers.get('x-frame-options') === 'SAMEORIGIN' && !headers.has('x-powered-by') && bodyText.includes('csrfmiddlewaretoken')) {
      addFinding('Django', 'Your website appears to be built with Django.', 'Detected via CSRF token and header behavior');
    }
    if (headers.get('set-cookie')?.includes('laravel_session')) {
      addFinding('Laravel', 'Your website is built with Laravel.', 'Detected via Laravel session cookie');
    }

  } catch (err: any) {
    // Silently fail — fingerprinting is best-effort
  } finally {
    clearTimeout(timeout);
  }
  
  return findings;
}
