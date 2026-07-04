'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Search, Loader2, CheckCircle, AlertTriangle, Lock, Globe, Mail, Server, Database } from 'lucide-react';
import Navbar from '@/components/Navbar';

const CHECKS_DISPLAY = [
  { icon: Lock,     label: 'SSL/TLS Certificate' },
  { icon: Shield,   label: 'Security Headers' },
  { icon: Globe,    label: 'Exposed Sensitive Files' },
  { icon: Mail,     label: 'Email Security (SPF/DMARC)' },
  { icon: Server,   label: 'Open Port Exposure' },
  { icon: Database, label: 'Data Breach Exposure' },
];

const STATS = [
  { value: '78%',  label: 'of Ghanaian SMEs have no security policy' },
  { value: 'GHS 50k+', label: 'average cost of a data breach for SMEs' },
  { value: '2026', label: 'Bank of Ghana CISD compliance deadline' },
];

export default function HomePage() {
  const router = useRouter();
  const [domain, setDomain] = useState('');
  const [scanning, setScanning] = useState(false);
  const [currentCheck, setCurrentCheck] = useState('');
  const [error, setError] = useState('');

  const startScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    setError('');
    setScanning(true);

    const checks = [
      'Checking SSL certificate...',
      'Scanning security headers...',
      'Testing exposed file paths...',
      'Checking email security (SPF/DMARC)...',
      'Scanning open ports...',
      'Checking data breach exposure...',
      'Calculating security score...',
    ];

    // Show progress labels while the real scan runs in the background
    let i = 0;
    const interval = setInterval(() => {
      if (i < checks.length) { setCurrentCheck(checks[i]); i++; }
    }, 1800);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      clearInterval(interval);

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Scan failed. Please try again.');
        setScanning(false);
        return;
      }
      router.push(`/report/${data.scanId}`);
    } catch {
      clearInterval(interval);
      setError('Could not connect. Please check your internet and try again.');
      setScanning(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">

        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-3xl mx-auto text-center">

            <div className="inline-flex items-center gap-2 bg-red-50 text-ghana-red text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-red-100">
              <AlertTriangle className="w-3 h-3" />
              Bank of Ghana CISD 2026 — Is your business compliant?
            </div>

            <h1 className="font-display font-bold text-5xl sm:text-6xl text-navy-950 leading-tight mb-5">
              Free security scan<br />
              <span className="text-ghana-red">for your business website</span>
            </h1>

            <p className="text-gray-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Find security vulnerabilities before attackers do. Enter your domain
              and get a plain-language security report in under 60 seconds — no technical
              knowledge required.
            </p>

            {/* ── The scan input ── */}
            <form onSubmit={startScan} className="max-w-xl mx-auto">
              <div className="flex gap-3 p-2 bg-navy-50 rounded-2xl border border-navy-100">
                <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-gray-200">
                  <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder="yourbusiness.com.gh"
                    className="flex-1 text-navy-950 placeholder:text-gray-400 outline-none text-sm font-medium"
                    disabled={scanning}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={scanning || !domain.trim()}
                  className="btn-primary text-sm px-5 py-3 rounded-xl"
                >
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {scanning ? 'Scanning...' : 'Scan Now'}
                </button>
              </div>

              {/* Live progress */}
              {scanning && (
                <div className="mt-4 bg-navy-950 rounded-xl p-4 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-xs font-mono">Scan running...</span>
                  </div>
                  <p className="text-green-300 text-sm font-mono">{currentCheck}</p>
                  <div className="mt-3 h-1 bg-navy-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-3 text-red-600 text-sm text-center">{error}</p>
              )}
            </form>

            <p className="text-xs text-gray-400 mt-4">
              Free • No signup required • Plain language results
            </p>
          </div>
        </section>

        {/* ── What we scan ────────────────────────────────────── */}
        <section className="py-16 px-6 bg-navy-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display font-bold text-2xl text-navy-950 text-center mb-2">
              What we check
            </h2>
            <p className="text-gray-500 text-center text-sm mb-10">
              7 automated security checks — results in plain Ghanaian business language, not technical jargon.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {CHECKS_DISPLAY.map(({ icon: Icon, label }) => (
                <div key={label} className="card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-navy-950 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-navy-950">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ───────────────────────────────────────────── */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div className="font-display font-bold text-4xl text-ghana-red mb-2">{value}</div>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Ghana compliance callout ─────────────────────────── */}
        <section className="py-16 px-6 bg-navy-950 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-10 h-10 text-ghana-red mx-auto mb-4" />
            <h2 className="font-display font-bold text-3xl mb-4">
              Built for Ghana's new cybersecurity regulations
            </h2>
            <p className="text-gray-300 leading-relaxed mb-8 max-w-xl mx-auto">
              The Bank of Ghana's CISD 2026 directive and the Data Protection Act 843
              now require businesses handling customer data to meet minimum security
              standards. Our compliance checker maps your gaps directly to these requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/compliance" className="btn-primary">Check Compliance →</a>
              <a href="/report/demo" className="btn-outline border-white text-white hover:bg-white hover:text-navy-950">See a sample report</a>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer className="py-10 px-6 border-t border-gray-100">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-navy-950 rounded flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-navy-950">CyberGH</span>
            </div>
            <p>Made in Ghana 🇬🇭 — Securing African businesses</p>
            <div className="flex gap-4">
              <a href="/privacy" className="hover:text-navy-950 transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-navy-950 transition-colors">Terms</a>
              <a href="/contact" className="hover:text-navy-950 transition-colors">Contact</a>
            </div>
          </div>
        </footer>

      </main>
    </>
  );
}
