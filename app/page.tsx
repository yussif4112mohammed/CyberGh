'use client';
import { useState, useEffect } from 'react';
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
  { icon: Globe,    label: 'WordPress Security (9 checks)' },
  { icon: Globe,    label: 'HTTP→HTTPS Redirect & Mixed Content' },
  { icon: Globe,    label: 'Subdomain Takeover Detection' },
  { icon: Globe,    label: 'Directory Listing Detection' },
];

const STATS = [
  { value: '78%',  label: 'of Ghanaian SMEs have no security policy' },
  { value: 'GHS 50k+', label: 'average cost of a data breach for SMEs' },
  { value: '2026', label: 'Bank of Ghana CISD compliance deadline' },
];

export default function HomePage() {
  const router = useRouter();
  const [domain, setDomain] = useState('');
  const [inputMode, setInputMode] = useState<'domain' | 'business'>('domain');
  const [businessName, setBusinessName] = useState('');
  const [lookupStatus, setLookupStatus] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [currentCheck, setCurrentCheck] = useState('');
  const [error, setError] = useState('');

  const [scanCount, setScanCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/scan/count')
      .then(r => r.json())
      .then(d => { if (d.count) setScanCount(d.count); })
      .catch(() => {});
  }, []);

  const startScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLookupError('');
    
    let scanDomain = domain.trim();
    
    // Business name mode: look up the domain first
    if (inputMode === 'business') {
      if (!businessName.trim()) return;
      setScanning(true);
      setLookupStatus('Finding website for "' + businessName.trim() + '"...');
      try {
        const lookupRes = await fetch('/api/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: businessName.trim() }),
        });
        const lookupData = await lookupRes.json();
        if (!lookupRes.ok || !lookupData.domain) {
          setLookupError(lookupData.error || 'Could not find website. Try entering the domain directly.');
          setScanning(false);
          setLookupStatus('');
          return;
        }
        scanDomain = lookupData.domain;
        setDomain(scanDomain);
        setLookupStatus(`Found: ${scanDomain} — scanning now...`);
      } catch {
        setLookupError('Could not connect. Please try again.');
        setScanning(false);
        setLookupStatus('');
        return;
      }
    } else {
      if (!scanDomain) return;
      setScanning(true);
    }

    const checks = [
      'Checking SSL certificate...',
      'Scanning security headers...',
      'Testing exposed file paths...',
      'Checking email security (SPF/DMARC)...',
      'Scanning open ports...',
      'Checking data breach exposure...',
      'Running WordPress security checks...',
      'Running subdomain checks...',
      'Checking directory listing...',
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
        body: JSON.stringify({ domain: scanDomain }),
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
              {/* Tab switcher */}
              <div className="flex bg-navy-100 rounded-xl p-1 mb-3">
                <button
                  type="button"
                  id="tab-domain"
                  onClick={() => { setInputMode('domain'); setLookupError(''); }}
                  className={`flex-1 text-sm font-medium py-2 px-4 rounded-lg transition-all ${
                    inputMode === 'domain'
                      ? 'bg-white text-navy-950 shadow-sm'
                      : 'text-gray-500 hover:text-navy-950'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 inline mr-1.5" />Domain
                </button>
                <button
                  type="button"
                  id="tab-business"
                  onClick={() => { setInputMode('business'); setLookupError(''); }}
                  className={`flex-1 text-sm font-medium py-2 px-4 rounded-lg transition-all ${
                    inputMode === 'business'
                      ? 'bg-white text-navy-950 shadow-sm'
                      : 'text-gray-500 hover:text-navy-950'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 inline mr-1.5" />Business Name
                </button>
              </div>

              <div className="flex gap-3 p-2 bg-navy-50 rounded-2xl border border-navy-100">
                <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-gray-200">
                  {inputMode === 'domain' ? (
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  {inputMode === 'domain' ? (
                    <input
                      type="text"
                      value={domain}
                      onChange={e => setDomain(e.target.value)}
                      placeholder="yourbusiness.com.gh"
                      className="flex-1 text-navy-950 placeholder:text-gray-400 outline-none text-sm font-medium"
                      disabled={scanning}
                      autoFocus
                      id="domain-input"
                    />
                  ) : (
                    <input
                      type="text"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="e.g. Ecobank Ghana, GCB Bank, Melcom"
                      className="flex-1 text-navy-950 placeholder:text-gray-400 outline-none text-sm font-medium"
                      disabled={scanning}
                      autoFocus
                      id="business-name-input"
                    />
                  )}
                </div>
                <button
                  type="submit"
                  disabled={scanning || (inputMode === 'domain' ? !domain.trim() : !businessName.trim())}
                  className="btn-primary text-sm px-5 py-3 rounded-xl"
                  id="scan-submit-btn"
                >
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {scanning ? 'Scanning...' : 'Scan Now'}
                </button>
              </div>

              {/* Lookup status */}
              {lookupStatus && !error && (
                <p className="mt-3 text-green-600 text-sm text-center font-medium">{lookupStatus}</p>
              )}
              {lookupError && (
                <p className="mt-3 text-red-600 text-sm text-center">{lookupError}</p>
              )}

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
            {scanCount && scanCount > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                🔒 <span className="font-semibold text-navy-950">{scanCount.toLocaleString()}</span> websites scanned so far
              </p>
            )}
          </div>
        </section>

        {/* ── Trust bar ────────────────────────────────────────── */}
        <div className="py-6 px-6 border-y border-gray-100 bg-gray-50">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1.5">🏦 Bank of Ghana CISD 2026 aligned</span>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1.5">🔒 Ghana Data Protection Act 843 mapped</span>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1.5">✅ No intrusive scanning — passive checks only</span>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1.5">🇬🇭 Built in Ghana for African businesses</span>
          </div>
        </div>

        {/* ── What we scan ────────────────────────────────────── */}
        <section className="py-16 px-6 bg-navy-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display font-bold text-2xl text-navy-950 text-center mb-2">
              What we check
            </h2>
            <p className="text-gray-500 text-center text-sm mb-10">
              {CHECKS_DISPLAY.length} automated security checks — results in plain Ghanaian business language, not technical jargon.
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

        {/* ── Testimonials ─────────────────────────────────────── */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display font-bold text-2xl text-navy-950 text-center mb-2">
              Trusted by Ghanaian businesses
            </h2>
            <p className="text-gray-500 text-center text-sm mb-10">
              From fintech to retail — ScanVault helps businesses understand and improve their security.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  quote: "We had no idea our website was exposing sensitive headers until ScanVault flagged it. Fixed in one afternoon with the copy-paste instructions.",
                  name: "Ama Asante",
                  role: "IT Manager",
                  company: "Accra Fintech Ltd",
                  score: 87,
                },
                {
                  quote: "The Bank of Ghana compliance checker saved us weeks of manual work. We now know exactly where our gaps are for the CISD 2026 deadline.",
                  name: "Kofi Mensah",
                  role: "Operations Director",
                  company: "GoldCoast MFI",
                  score: 74,
                },
                {
                  quote: "Simple, fast, and in plain English. My team understood every finding without needing a cybersecurity degree. Exactly what we needed.",
                  name: "Abena Owusu",
                  role: "CEO",
                  company: "Kumasi Fashion Hub",
                  score: 91,
                },
              ].map((t, i) => (
                <div key={i} className="card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(5)].map((_, s) => (
                        <svg key={s} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-navy-950">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role}, {t.company}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{t.score}</div>
                      <div className="text-xs text-gray-400">Security score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              <span className="font-semibold text-navy-950">ScanVault</span>
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
