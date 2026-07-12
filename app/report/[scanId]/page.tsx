'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Shield, Download, RefreshCw, Loader2, Mail, CheckCircle, ExternalLink } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ScoreGauge from '@/components/ScoreGauge';
import FindingCard from '@/components/FindingCard';
import { ScanResult } from '@/types/scan';

const CATEGORY_LABELS: Record<string, string> = {
  ssl: 'SSL/TLS', headers: 'Security Headers', paths: 'Exposed Files',
  dns: 'Email Security', ports: 'Open Ports', cookies: 'Cookies',
  breach: 'Data Breach', leakage: 'Info Leakage', wordpress: 'WordPress',
};

export default function ReportPage() {
  const { scanId } = useParams();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);

  useEffect(() => {
    if (!scanId) return;
    const url = scanId === 'demo' ? '/api/demo' : `/api/scan/${scanId}`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.result) {
          setResult(data.result);
          if (scanId === 'demo') setShowFullReport(true); // show full report for demo
        } else setError('Report not found.');
      })
      .catch(() => setError('Failed to load report.'))
      .finally(() => setLoading(false));
  }, [scanId]);

  const saveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmail(true);
    try {
      await fetch(`/api/scan/${scanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setEmailSaved(true);
      setShowFullReport(true);
    } finally {
      setSavingEmail(false);
    }
  };

  if (loading) return (
    <><Navbar />
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy-950 mx-auto mb-3" />
          <p className="text-gray-500">Loading your security report...</p>
        </div>
      </div>
    </>
  );

  if (error || !result) return (
    <><Navbar />
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Report not found.'}</p>
          <a href="/" className="btn-primary">Run a new scan</a>
        </div>
      </div>
    </>
  );

  // Show top 3 findings as a teaser before email capture
  const teaserFindings = result.findings.filter(f => f.severity !== 'pass').slice(0, 3);
  const allFindings = result.findings;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">

          {/* ── Header ── */}
          <div className="card p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <ScoreGauge score={result.score} size="lg" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Security Report</p>
                <h1 className="font-display font-bold text-3xl text-navy-950 mb-1">
                  {result.domain}
                </h1>
                <p className="text-sm text-gray-400 mb-4">
                  Scanned {new Date(result.created_at).toLocaleDateString('en-GH', { dateStyle: 'long' })}
                </p>

                {/* Summary badges */}
                <div className="flex flex-wrap gap-2">
                  {result.summary.critical > 0 && <span className="severity-critical">{result.summary.critical} Critical</span>}
                  {result.summary.high > 0     && <span className="severity-high">{result.summary.high} High</span>}
                  {result.summary.medium > 0   && <span className="severity-medium">{result.summary.medium} Medium</span>}
                  {result.summary.low > 0      && <span className="severity-low">{result.summary.low} Low</span>}
                  {result.summary.pass > 0     && <span className="severity-pass">{result.summary.pass} Passed</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <a href="/" className="btn-outline text-sm py-2">
                  <RefreshCw className="w-3.5 h-3.5" /> New Scan
                </a>
              </div>
            </div>
          </div>

          {/* ── Score interpretation ── */}
          <div className={`card p-5 mb-6 border-l-4 ${
            result.score >= 80 ? 'border-l-green-500 bg-green-50' :
            result.score >= 60 ? 'border-l-amber-500 bg-amber-50' :
            result.score >= 40 ? 'border-l-orange-500 bg-orange-50' :
            'border-l-red-500 bg-red-50'
          }`}>
            <p className="text-sm font-medium text-navy-950">
              {result.score >= 80 ? '✅ Your website has a good security posture. Keep monitoring and address any remaining issues.' :
               result.score >= 60 ? '⚠️ Your website has some security gaps that should be addressed soon. These issues may put customer data at risk.' :
               result.score >= 40 ? '🔴 Your website has significant security problems. Customer data may be at risk and you may not be compliant with Ghana\'s Data Protection Act.' :
               '🚨 Your website has critical security vulnerabilities that need immediate attention. This is a serious risk to your business and customer data.'}
            </p>
          </div>

          {/* ── Teaser findings (always visible) ── */}
          {!showFullReport && (
            <>
              <h2 className="font-display font-bold text-xl text-navy-950 mb-4">
                Top issues found ({teaserFindings.length} of {result.findings.filter(f => f.severity !== 'pass').length} shown)
              </h2>
              <div className="space-y-3 mb-6">
                {teaserFindings.map((f, i) => <FindingCard key={i} finding={f} index={i} />)}
              </div>

              {/* ── Email gate ── */}
              <div className="card p-8 text-center mb-6 border-2 border-dashed border-navy-200">
                <Mail className="w-10 h-10 text-navy-700 mx-auto mb-3" />
                <h3 className="font-display font-bold text-xl text-navy-950 mb-2">
                  See your full security report
                </h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                  Enter your email to unlock all {result.findings.length} findings, detailed fix instructions, and your Ghana compliance score.
                </p>
                <form onSubmit={saveEmail} className="flex gap-3 max-w-sm mx-auto">
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@yourbusiness.com"
                    className="input flex-1 text-sm"
                  />
                  <button type="submit" disabled={savingEmail} className="btn-primary text-sm px-4 py-2.5">
                    {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unlock'}
                  </button>
                </form>
                <p className="text-xs text-gray-400 mt-3">No spam. We'll send you the report and one follow-up.</p>
              </div>
            </>
          )}

          {/* ── Full report ── */}
          {showFullReport && (
            <>
              {emailSaved && (
                <div className="card p-4 mb-6 bg-green-50 border-green-100 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">Report sent to <strong>{email}</strong> — check your inbox.</p>
                </div>
              )}

              <h2 className="font-display font-bold text-xl text-navy-950 mb-4">
                All findings ({result.findings.length})
              </h2>
              <div className="space-y-3 mb-8">
                {allFindings.map((f, i) => <FindingCard key={i} finding={f} index={i} />)}
              </div>

              {/* ── CTA ── */}
              <div className="card p-8 bg-navy-950 text-white text-center">
                <Shield className="w-8 h-8 text-ghana-red mx-auto mb-3" />
                <h3 className="font-display font-bold text-xl mb-2">
                  Need help fixing these issues?
                </h3>
                <p className="text-gray-300 text-sm mb-5 max-w-sm mx-auto">
                  Book a free 30-minute consultation. We'll walk through your report and create a fix plan for your business.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href="/contact" className="btn-primary">Book Free Consultation</a>
                  <a href="/compliance" className="btn-outline border-white text-white hover:bg-white hover:text-navy-950">
                    Check Ghana Compliance <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </>
  );
}
