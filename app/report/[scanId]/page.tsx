'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shield, Download, RefreshCw, Loader2, Mail, CheckCircle, ExternalLink, Copy, Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ScoreGauge from '@/components/ScoreGauge';
import FindingCard from '@/components/FindingCard';
import { ScanResult } from '@/types/scan';

const CATEGORY_LABELS: Record<string, string> = {
  ssl: 'SSL/TLS', headers: 'Security Headers', paths: 'Exposed Files',
  dns: 'Email Security', ports: 'Open Ports', cookies: 'Cookies',
  breach: 'Data Breach', leakage: 'Info Leakage', wordpress: 'WordPress',
  redirect: 'HTTP Redirect',
  subdomain: 'Subdomain',
  directory: 'Directory Listing',
  fingerprint: 'Tech Stack',
};

export default function ReportPage() {
  const { scanId } = useParams();
  const router = useRouter();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [prevResult, setPrevResult] = useState<ScanResult | null>(null);
  const [rescanLoading, setRescanLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; score: number; created_at: string }>>([]);

  useEffect(() => {
    if (!scanId) return;
    const url = scanId === 'demo' ? '/api/demo' : `/api/scan/${scanId}`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.result) {
          setResult(data.result);
          if (scanId === 'demo') setShowFullReport(true); // show full report for demo

          if (data.result.previous_scan_id) {
            fetch(`/api/scan/${data.result.previous_scan_id}`)
              .then(r => r.json())
              .then(prev => { if (prev.result) setPrevResult(prev.result); })
              .catch(() => {});
          }

          fetch(`/api/scan/history?domain=${encodeURIComponent(data.result.domain)}`)
            .then(r => r.json())
            .then(h => { if (h.history && h.history.length >= 2) setHistory(h.history); })
            .catch(() => {});
        } else setError('Report not found.');
      })
      .catch(() => setError('Failed to load report.'))
      .finally(() => setLoading(false));
  }, [scanId]);

  const handleRescan = async () => {
    if (!result) return;
    setRescanLoading(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: result.domain }),
      });
      const data = await res.json();
      if (data.scanId) {
        router.push(`/report/${data.scanId}`);
      }
    } catch {
      setRescanLoading(false);
    }
  };

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
      <div className="print:hidden"><Navbar /></div>
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

                {/* Detected Technologies */}
                {result.findings.some(f => f.category === 'fingerprint' && f.severity === 'info') && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Detected Technologies</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.findings
                        .filter(f => f.category === 'fingerprint' && f.severity === 'info')
                        .map((f, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs bg-navy-100 text-navy-800 px-2.5 py-1 rounded-full font-medium">
                            {f.title.replace('Detected: ', '')}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

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
                <button
                  id="share-report-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="btn-outline text-sm py-2"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  id="download-pdf-btn"
                  onClick={() => window.print()}
                  className="btn-outline text-sm py-2 print:hidden"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button
                  onClick={handleRescan}
                  disabled={rescanLoading}
                  id="rescan-btn"
                  className="btn-outline text-sm py-2 print:hidden"
                >
                  {rescanLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {rescanLoading ? 'Scanning...' : 'Re-scan'}
                </button>
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

          {/* ── Score Trend ── */}
          {history.length >= 2 && (
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-bold text-lg text-navy-950">Score history</h2>
                  <p className="text-sm text-gray-400">{history.length} scans for {result.domain}</p>
                </div>
                {(() => {
                  const first = history[0].score;
                  const last = history[history.length - 1].score;
                  const delta = last - first;
                  return (
                    <div className={`text-2xl font-bold ${delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {delta > 0 ? '+' : ''}{delta} pts
                    </div>
                  );
                })()}
              </div>

              {/* SVG Sparkline */}
              {(() => {
                const W = 600, H = 100, PAD = 10;
                const scores = history.map(h => h.score);
                const minScore = Math.min(...scores) - 5;
                const maxScore = Math.max(...scores) + 5;
                const xStep = (W - PAD * 2) / (scores.length - 1);
                const yScale = (s: number) => H - PAD - ((s - minScore) / (maxScore - minScore)) * (H - PAD * 2);
                const points = scores.map((s, i) => `${PAD + i * xStep},${yScale(s)}`);
                const pathD = `M ${points.join(' L ')}`;
                
                return (
                  <div className="relative">
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="none">
                      {/* Grid lines */}
                      {[25, 50, 75].map(y => (
                        <line key={y}
                          x1={PAD} y1={yScale(y)} x2={W - PAD} y2={yScale(y)}
                          stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4"
                        />
                      ))}
                      {/* Line */}
                      <path d={pathD} fill="none" stroke="#0A1628" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {/* Area fill */}
                      <path
                        d={`${pathD} L ${PAD + (scores.length - 1) * xStep},${H - PAD} L ${PAD},${H - PAD} Z`}
                        fill="#0A1628" fillOpacity="0.05"
                      />
                      {/* Data points */}
                      {scores.map((s, i) => (
                        <circle key={i}
                          cx={PAD + i * xStep} cy={yScale(s)} r="4"
                          fill="white" stroke="#0A1628" strokeWidth="2"
                        />
                      ))}
                    </svg>
                    {/* X-axis dates */}
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{new Date(history[0].created_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })}</span>
                      <span>{new Date(history[history.length - 1].created_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Change diff (when previous scan exists) ── */}
          {prevResult && showFullReport && (() => {
            // Compute new findings (in current, not in prev by title)
            const prevTitles = new Set(prevResult.findings.map(f => f.title));
            const currTitles = new Set(result.findings.map(f => f.title));
            const newFindings = result.findings.filter(f => !prevTitles.has(f.title) && f.severity !== 'pass');
            const fixedFindings = prevResult.findings.filter(f => !currTitles.has(f.title) && f.severity !== 'pass');
            const scoreDelta = result.score - prevResult.score;

            if (newFindings.length === 0 && fixedFindings.length === 0 && scoreDelta === 0) return null;

            return (
              <div className="card p-6 mb-6 border-l-4 border-l-navy-700">
                <h2 className="font-display font-bold text-lg text-navy-950 mb-4">Changes since last scan</h2>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`text-2xl font-bold ${scoreDelta > 0 ? 'text-green-600' : scoreDelta < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {scoreDelta > 0 ? '+' : ''}{scoreDelta} pts
                  </div>
                  <div className="text-sm text-gray-500">
                    Score changed from <strong>{prevResult.score}</strong> to <strong>{result.score}</strong>
                  </div>
                </div>
                {fixedFindings.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-green-700 mb-2">✅ {fixedFindings.length} issue{fixedFindings.length > 1 ? 's' : ''} fixed</p>
                    <div className="space-y-1">
                      {fixedFindings.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                          {f.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {newFindings.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-2">🆕 {newFindings.length} new issue{newFindings.length > 1 ? 's' : ''} detected</p>
                    <div className="space-y-1">
                      {newFindings.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                          {f.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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
