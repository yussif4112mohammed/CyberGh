import * as tls from 'tls';
import { Finding } from '@/types/scan';

export async function checkSSL(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      findings.push({
        category: 'ssl',
        severity: 'high',
        title: 'SSL/TLS check timed out',
        description: 'We could not connect to your site over HTTPS within the time limit. This may mean SSL is not set up, or the server is slow to respond.',
        fix: 'Make sure your website has a valid SSL certificate installed. Contact your hosting provider if you\'re unsure — most modern hosts offer free SSL via Let\'s Encrypt.',
      });
      resolve(findings);
    }, 8000);

    try {
      const socket = tls.connect({ host: domain, port: 443, servername: domain }, () => {
        clearTimeout(timeout);
        const cert = socket.getPeerCertificate();
        const authorized = socket.authorized;
        const protocol = socket.getProtocol();

        // Check: certificate expiry
        if (cert && cert.valid_to) {
          const expiresAt = new Date(cert.valid_to);
          const now = new Date();
          const daysLeft = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysLeft < 0) {
            findings.push({
              category: 'ssl',
              severity: 'critical',
              title: 'SSL certificate has expired',
              description: `Your SSL certificate expired ${Math.abs(daysLeft)} days ago. Visitors see a security warning and many browsers block access entirely. This is also a compliance violation.`,
              fix: 'Renew your SSL certificate immediately. If you use cPanel, Plesk, or most hosting dashboards, there\'s a button to renew. Free certificates from Let\'s Encrypt renew automatically if configured correctly.',
              evidence: `Expired: ${cert.valid_to}`,
            });
          } else if (daysLeft < 14) {
            findings.push({
              category: 'ssl',
              severity: 'high',
              title: `SSL certificate expires in ${daysLeft} days`,
              description: `Your certificate is about to expire. Once it does, visitors will see security warnings and your site will effectively go offline for most users.`,
              fix: 'Renew your SSL certificate now. Don\'t wait — renewals sometimes take time to propagate.',
              evidence: `Expires: ${cert.valid_to}`,
            });
          } else if (daysLeft < 30) {
            findings.push({
              category: 'ssl',
              severity: 'medium',
              title: `SSL certificate expires in ${daysLeft} days`,
              description: 'Your certificate will expire soon. Plan a renewal in the next week to avoid any service interruption.',
              fix: 'Renew your SSL certificate before it expires. Check if auto-renewal is enabled on your hosting account.',
              evidence: `Expires: ${cert.valid_to}`,
            });
          } else {
            findings.push({
              category: 'ssl',
              severity: 'pass',
              title: 'SSL certificate is valid',
              description: `Your certificate is valid and expires in ${daysLeft} days.`,
              fix: '',
              evidence: `Expires: ${cert.valid_to}`,
            });
          }
        }

        // Check: cert chain validation
        if (!authorized) {
          findings.push({
            category: 'ssl',
            severity: 'high',
            title: 'SSL certificate chain is not trusted',
            description: 'Your SSL certificate exists but the chain of trust is broken — browsers will show a security warning. This usually means a missing intermediate certificate.',
            fix: 'Contact your SSL provider or hosting company and ask them to reinstall the certificate with the full chain (root + intermediate + your cert).',
            evidence: (socket.authorizationError as any)?.message || socket.authorizationError || 'Authorization failed',
          });
        }

        // Check: old TLS versions
        if (protocol && (protocol.includes('TLSv1 ') || protocol.includes('TLSv1.1'))) {
          findings.push({
            category: 'ssl',
            severity: 'medium',
            title: `Outdated TLS version in use (${protocol})`,
            description: 'TLS 1.0 and 1.1 are deprecated and have known vulnerabilities. Modern browsers may block connections that use them.',
            fix: 'Disable TLS 1.0 and 1.1 in your server configuration and enable TLS 1.2 and 1.3 only. Ask your hosting provider to help if needed.',
            evidence: `Protocol: ${protocol}`,
          });
        } else if (protocol) {
          findings.push({
            category: 'ssl',
            severity: 'pass',
            title: `Modern TLS version in use (${protocol})`,
            description: 'Your server is using a secure, up-to-date TLS version.',
            fix: '',
            evidence: `Protocol: ${protocol}`,
          });
        }

        socket.destroy();
        resolve(findings);
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        findings.push({
          category: 'ssl',
          severity: 'critical',
          title: 'No SSL/HTTPS connection available',
          description: 'Your website does not have HTTPS set up, or the SSL connection failed. Visitors\' data (passwords, form inputs) is sent unencrypted over the internet. This is a critical risk and a violation of Ghana\'s Data Protection Act.',
          fix: 'Set up an SSL certificate immediately. Your hosting provider likely offers free SSL via Let\'s Encrypt — check your hosting control panel or contact their support.',
          evidence: err.message,
        });
        resolve(findings);
      });
    } catch (err: any) {
      clearTimeout(timeout);
      findings.push({
        category: 'ssl',
        severity: 'critical',
        title: 'Could not check SSL',
        description: 'We encountered an error while checking your SSL setup.',
        fix: 'Make sure your domain is publicly accessible and has HTTPS configured.',
        evidence: err.message,
      });
      resolve(findings);
    }
  });
}
