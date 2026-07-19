import { ScanResult } from '@/types/scan';

// Lazy initialization — don't crash if RESEND_API_KEY is missing
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  const { Resend } = require('resend');
  return new Resend(process.env.RESEND_API_KEY);
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#C8102E',
  high:     '#E65100',
  medium:   '#F57C00',
  low:      '#1E88E5',
  info:     '#6B7280',
  pass:     '#2E7D32',
};

function getScoreColor(score: number): string {
  if (score >= 80) return '#2E7D32';
  if (score >= 60) return '#F57C00';
  if (score >= 40) return '#E65100';
  return '#C8102E';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Critical';
}

function buildReportEmail(result: ScanResult, reportUrl: string): string {
  const scoreColor = getScoreColor(result.score);
  const scoreLabel = getScoreLabel(result.score);
  const criticalAndHigh = result.findings.filter(f =>
    f.severity === 'critical' || f.severity === 'high'
  ).slice(0, 3);

  const findingRows = criticalAndHigh.map(f => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #F0F4FA;">
        <span style="
          display: inline-block;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          background: ${f.severity === 'critical' ? '#FEE2E2' : '#FEF3C7'};
          color: ${SEVERITY_COLORS[f.severity]};
          margin-bottom: 4px;
        ">${f.severity.toUpperCase()}</span>
        <div style="font-weight: 600; color: #0A1628; font-size: 14px; margin-bottom: 4px;">
          ${f.title}
        </div>
        <div style="color: #6B7280; font-size: 13px; line-height: 1.5;">
          ${f.description.substring(0, 120)}...
        </div>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Security Report — ${result.domain}</title>
</head>
<body style="margin: 0; padding: 0; background: #F4F6FA; font-family: -apple-system, Inter, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F4F6FA; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: #0A1628; border-radius: 16px 16px 0 0; padding: 28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 800; color: white; letter-spacing: -0.5px;">
                      Cyber<span style="color: #C8102E;">GH</span>
                    </span>
                    <div style="color: #94A3B8; font-size: 11px; margin-top: 2px; letter-spacing: 1px;">
                      SECURITY FOR EVERY GHANAIAN BUSINESS
                    </div>
                  </td>
                  <td align="right">
                    <span style="
                      background: rgba(255,255,255,0.1);
                      color: #94A3B8;
                      font-size: 11px;
                      padding: 4px 10px;
                      border-radius: 20px;
                    ">Security Report</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Score card -->
          <tr>
            <td style="background: white; padding: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="color: #6B7280; font-size: 13px; margin-bottom: 4px;">
                      Security scan for
                    </div>
                    <div style="font-size: 24px; font-weight: 800; color: #0A1628; margin-bottom: 20px;">
                      ${result.domain}
                    </div>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <div style="
                      width: 80px;
                      height: 80px;
                      border-radius: 50%;
                      border: 6px solid ${scoreColor};
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      text-align: center;
                    ">
                      <div>
                        <div style="font-size: 24px; font-weight: 800; color: ${scoreColor}; line-height: 1;">
                          ${result.score}
                        </div>
                        <div style="font-size: 10px; color: #6B7280;">/ 100</div>
                      </div>
                    </div>
                    <div style="font-weight: 700; color: ${scoreColor}; font-size: 13px; margin-top: 4px; text-align: center;">
                      ${scoreLabel}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Summary badges -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  ${result.summary.critical > 0 ? `<td style="padding-right: 8px;"><span style="background: #FEE2E2; color: #C8102E; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;">${result.summary.critical} Critical</span></td>` : ''}
                  ${result.summary.high > 0 ? `<td style="padding-right: 8px;"><span style="background: #FEF3C7; color: #E65100; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;">${result.summary.high} High</span></td>` : ''}
                  ${result.summary.medium > 0 ? `<td style="padding-right: 8px;"><span style="background: #FEF9C3; color: #F57C00; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;">${result.summary.medium} Medium</span></td>` : ''}
                  ${result.summary.pass > 0 ? `<td><span style="background: #DCFCE7; color: #2E7D32; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;">${result.summary.pass} Passed</span></td>` : ''}
                </tr>
              </table>

              <!-- Alert box -->
              <div style="
                background: ${result.score < 40 ? '#FEE2E2' : result.score < 60 ? '#FEF3C7' : '#DCFCE7'};
                border-left: 4px solid ${scoreColor};
                border-radius: 8px;
                padding: 14px 16px;
                margin-bottom: 28px;
                font-size: 13px;
                color: #0A1628;
                line-height: 1.5;
              ">
                ${result.score < 40
                  ? '🚨 Your website has critical security vulnerabilities that need immediate attention. This is a serious risk to your business and customer data.'
                  : result.score < 60
                  ? '🔴 Your website has significant security problems that should be fixed soon. Customer data may be at risk.'
                  : result.score < 80
                  ? '⚠️ Your website has some security gaps to address. Review the findings below and fix them in order of priority.'
                  : '✅ Your website has a good security posture. Keep monitoring and address any remaining issues.'}
              </div>

              <!-- Top findings -->
              ${criticalAndHigh.length > 0 ? `
              <div style="font-size: 14px; font-weight: 700; color: #0A1628; margin-bottom: 12px;">
                Top issues to fix first
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${findingRows}
              </table>
              <div style="margin-top: 16px; margin-bottom: 24px;">
                <a href="${reportUrl}" style="
                  display: inline-block;
                  background: #C8102E;
                  color: white;
                  text-decoration: none;
                  padding: 12px 24px;
                  border-radius: 10px;
                  font-weight: 600;
                  font-size: 14px;
                ">View Full Report →</a>
              </div>
              ` : ''}

              <!-- CTA -->
              <div style="
                background: #0A1628;
                border-radius: 12px;
                padding: 24px;
                text-align: center;
              ">
                <div style="color: white; font-size: 16px; font-weight: 700; margin-bottom: 8px;">
                  Need help fixing these issues?
                </div>
                <div style="color: #94A3B8; font-size: 13px; margin-bottom: 16px;">
                  Book a free 30-minute consultation. We'll walk through your report and create a fix plan.
                </div>
                <a href="https://scanvault.vercel.app/contact" style="
                  display: inline-block;
                  background: #C8102E;
                  color: white;
                  text-decoration: none;
                  padding: 10px 20px;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 13px;
                ">Book Free Consultation</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
              background: #F4F6FA;
              border-radius: 0 0 16px 16px;
              padding: 20px 32px;
              text-align: center;
            ">
              <div style="color: #94A3B8; font-size: 12px; line-height: 1.6;">
                You received this because you requested a security scan on ScanVault.<br>
                <a href="https://scanvault.vercel.app" style="color: #0A1628; text-decoration: none; font-weight: 600;">scanvault.vercel.app</a>
                &nbsp;·&nbsp;
                <a href="https://scanvault.vercel.app/privacy" style="color: #94A3B8; text-decoration: none;">Privacy Policy</a>
                &nbsp;·&nbsp; Made in Ghana 🇬🇭
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

export async function sendReportEmail(
  email: string,
  result: ScanResult,
  scanId: string
): Promise<boolean> {
  try {
    const resend = getResend();
    if (!resend) {
      console.log('Email skipped — RESEND_API_KEY not set');
      return false;
    }

    const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://scanvault.vercel.app'}/report/${scanId}`;
    const scoreLabel = getScoreLabel(result.score);
    const toEmail = process.env.RESEND_TEST_MODE === 'true'
      ? (process.env.RESEND_VERIFIED_EMAIL || email)
      : email;

    await resend.emails.send({
      from: 'ScanVault <onboarding@resend.dev>',
      to: toEmail,
      subject: `Your security report for ${result.domain} — Score: ${result.score}/100 (${scoreLabel})`,
      html: buildReportEmail(result, reportUrl),
    });

    return true;
  } catch (err) {
    console.error('Email send failed:', err);
    return false;
  }
}

export async function sendMonitoringAlertEmail(
  email: string,
  domain: string,
  newScore: number,
  prevScore: number,
  scanId: string,
  fixedIssues: string[],
  newIssues: string[]
): Promise<boolean> {
  try {
    const resend = getResend();
    if (!resend) {
      console.log('Email skipped — RESEND_API_KEY not set');
      return false;
    }

    const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://scanvault.vercel.app'}/report/${scanId}`;
    const scoreDelta = newScore - prevScore;
    const scoreColor = scoreDelta > 0 ? '#2E7D32' : scoreDelta < 0 ? '#C8102E' : '#6B7280';
    const scoreSign = scoreDelta > 0 ? '+' : '';

    const toEmail = process.env.RESEND_TEST_MODE === 'true'
      ? (process.env.RESEND_VERIFIED_EMAIL || email)
      : email;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ScanVault Monitoring Alert</title>
</head>
<body style="background: #F4F6FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px; -webkit-font-smoothing: antialiased;">

  <table style="width: 100%; max-width: 600px; margin: 0 auto; border-spacing: 0;">
    <tr>
      <td style="background: white; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; padding: 0;">
        <table style="width: 100%; border-spacing: 0;">
          
          <!-- Header -->
          <tr>
            <td style="background: #0A1628; padding: 24px 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">ScanVault Alert</h1>
              <p style="color: #94A3B8; margin: 4px 0 0; font-size: 13px;">Continuous Website Security Monitoring</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0A1628; margin: 0 0 16px;">
                Security update for ${domain}
              </h2>
              
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 13px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
                  Security Score
                </div>
                <div style="font-size: 32px; font-weight: 800; color: #0A1628; margin-bottom: 4px;">
                  ${newScore} <span style="font-size: 16px; font-weight: 400; color: #94A3B8;">/ 100</span>
                </div>
                <div style="font-size: 14px; font-weight: 700; color: ${scoreColor};">
                  Score changed by ${scoreSign}${scoreDelta} points (from ${prevScore})
                </div>
              </div>

              \${fixedIssues.length > 0 ? \`
              <div style="margin-bottom: 20px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #2E7D32; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;">
                  ✅ \${fixedIssues.length} issue\${fixedIssues.length > 1 ? 's' : ''} fixed
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
                  \${fixedIssues.map(title => \`<li>\${title}</li>\`).join('')}
                </ul>
              </div>
              \` : ''}

              \${newIssues.length > 0 ? \`
              <div style="margin-bottom: 24px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #C8102E; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;">
                  ⚠️ \${newIssues.length} new issue\${newIssues.length > 1 ? 's' : ''} detected
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
                  \${newIssues.map(title => \`<li>\${title}</li>\`).join('')}
                </ul>
              </div>
              \` : ''}

              <div style="text-align: center; margin-top: 32px;">
                <a href="\${reportUrl}" style="
                  display: inline-block;
                  background: #0A1628;
                  color: white;
                  text-decoration: none;
                  padding: 12px 24px;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 14px;
                ">View Detailed Report</a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F4F6FA; border-radius: 0 0 16px 16px; padding: 20px 32px; text-align: center;">
              <div style="color: #94A3B8; font-size: 12px; line-height: 1.6;">
                You received this because weekly security monitoring is enabled for ${domain} on ScanVault.<br>
                <a href="https://scanvault.vercel.app" style="color: #0A1628; text-decoration: none; font-weight: 600;">scanvault.app</a>
                &nbsp;·&nbsp; Made in Ghana 🇬🇭
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `;

    await resend.emails.send({
      from: 'ScanVault <onboarding@resend.dev>',
      to: toEmail,
      subject: `ScanVault Security Alert: ${domain} score updated (${scoreSign}${scoreDelta} pts)`,
      html,
    });

    return true;
  } catch (err) {
    console.error('Monitoring email failed:', err);
    return false;
  }
}
