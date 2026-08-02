'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Search, Loader2, AlertTriangle, Lock, Globe, Mail, Server, Database } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';


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
  { icon: Shield,   label: 'CORS Configuration Check' },
  { icon: Globe,    label: 'Metadata & Configuration' },
];

const STATS = [
  { value: '78%',  label: 'of African SMEs have no security policy' },
  { value: 'GHS 50k+', label: 'average cost of a data breach for SMEs' },
  { value: '1M+', label: 'businesses across Africa trust our insights' },
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
  const [businessMatches, setBusinessMatches] = useState<Array<{ name: string; domain: string; country: string; flag: string; source: string }>>([]);
  const [authorized, setAuthorized] = useState(false);

  // ── Scroll-triggered animations ──────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.fade-up, .slide-left, .slide-right').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const [scanCount, setScanCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/scan/count')
      .then(r => r.json())
      .then(d => { if (d.count) setScanCount(d.count); })
      .catch(() => {});
  }, []);

  const executeScan = async (targetDomain: string) => {
    setScanning(true);
    setLookupStatus('');
    setError('');
    
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
      'Auditing CORS policies...',
      'Analyzing robots.txt & security.txt...',
      'Calculating security score...',
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < checks.length) { setCurrentCheck(checks[i]); i++; }
    }, 1800);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: targetDomain }),
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

  const startScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorized) {
      setError('Please confirm legal authorization before scanning.');
      return;
    }
    setError('');
    setLookupError('');
    setBusinessMatches([]);
    
    let scanDomain = domain.trim();
    
    // Business name mode: look up the domain first
    if (inputMode === 'business') {
      if (!businessName.trim()) return;
      setScanning(true);
      setLookupStatus('Finding websites for "' + businessName.trim() + '"...');
      try {
        const lookupRes = await fetch('/api/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: businessName.trim() }),
        });
        const lookupData = await lookupRes.json();
        if (!lookupRes.ok || (!lookupData.domain && !lookupData.matches)) {
          setLookupError(lookupData.error || 'Could not find website. Try entering the domain directly.');
          setScanning(false);
          setLookupStatus('');
          return;
        }

        // If multiple matches/countries exist, let the user choose!
        if (lookupData.matches && lookupData.matches.length > 1) {
          setBusinessMatches(lookupData.matches);
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
    }

    executeScan(scanDomain);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-navy-950 relative overflow-hidden">

        {/* ── Glow Orbs ─────────────────────────────────────── */}
        <div className="glow-orb-teal w-96 h-96 -top-48 -left-48 orb-float-a" />
        <div className="glow-orb-blue w-96 h-96 -top-48 -right-48 orb-float-b" />
        <div className="glow-orb-teal w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 orb-float-a" style={{opacity:0.08}} />

        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="pt-32 pb-20 px-6 relative">
          <div className="max-w-3xl mx-auto text-center">

            <div className="fade-up inline-flex items-center gap-2 bg-teal-500/10 text-teal-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-teal-500/30">
              <AlertTriangle className="w-3 h-3" />
              Protecting African businesses from emerging cyber threats
            </div>

            <h1 className="fade-up font-display font-bold text-5xl sm:text-6xl text-white leading-tight mb-5" style={{transitionDelay:'100ms'}}>
              Free security scan<br />
              <span className="text-teal-400">for your business website</span>
            </h1>

            <p className="fade-up text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{transitionDelay:'200ms'}}>
              Find security vulnerabilities before attackers do. Enter your domain
              and get a plain-language security report in under 60 seconds — no technical
              knowledge required.
            </p>

            {/* ── The scan input ── */}
            {scanning ? (
              <div className="max-w-xl mx-auto card rounded-3xl p-10 flex flex-col items-center justify-center min-h-[360px] animate-in fade-in zoom-in duration-500 relative overflow-hidden">
                {/* Teal Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
                  <div className="h-full bg-teal-gradient transition-all duration-1000 ease-out shadow-teal-sm" style={{ width: `${Math.max(10, Math.random() * 80)}%` }}></div>
                </div>

                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                  <div className="relative bg-teal-500/10 rounded-full p-5 border border-teal-500/30">
                    <Shield className="w-12 h-12 text-teal-400 animate-pulse" />
                  </div>
                </div>

                <h3 className="font-display font-bold text-2xl text-white mb-4 text-center">
                  Analyzing {inputMode === 'domain' ? domain : businessName}
                </h3>

                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-300 bg-white/5 px-5 py-2.5 rounded-full border border-white/10">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                    <span className="min-w-[260px] text-center transition-all duration-300">{currentCheck || 'Initializing scan engine...'}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono">This usually takes about 15 seconds</p>
                </div>
              </div>
            ) : (
              <form onSubmit={startScan} className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Tab switcher */}
              <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-3">
                <button
                  type="button"
                  id="tab-domain"
                  onClick={() => { setInputMode('domain'); setLookupError(''); }}
                  className={`flex-1 text-sm font-medium py-2 px-4 rounded-lg transition-all ${
                    inputMode === 'domain'
                      ? 'bg-teal-gradient text-white shadow-teal-sm'
                      : 'text-gray-400 hover:text-white'
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
                      ? 'bg-teal-gradient text-white shadow-teal-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 inline mr-1.5" />Business Name
                </button>
              </div>

              <div className="flex gap-3 p-2 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                  {inputMode === 'domain' ? (
                    <Globe className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  ) : (
                    <Search className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  )}
                  {inputMode === 'domain' ? (
                    <input
                      type="text"
                      value={domain}
                      onChange={e => setDomain(e.target.value)}
                      placeholder="yourbusiness.com.gh"
                      className="flex-1 text-white placeholder:text-gray-500 outline-none text-sm font-medium bg-transparent"
                      disabled={scanning}
                      autoFocus
                      id="domain-input"
                    />
                  ) : (
                    <input
                      type="text"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="e.g. Standard Bank, MTN Group, Safaricom"
                      className="flex-1 text-white placeholder:text-gray-500 outline-none text-sm font-medium bg-transparent"
                      disabled={scanning}
                      autoFocus
                      id="business-name-input"
                    />
                  )}
                </div>
                <button
                  type="submit"
                  disabled={scanning || !authorized || (inputMode === 'domain' ? !domain.trim() : !businessName.trim())}
                  className="btn-primary text-sm px-5 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  id="scan-submit-btn"
                >
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {scanning ? 'Scanning...' : 'Scan Now'}
                </button>
              </div>

              {/* Legal authorization checkbox */}
              <div className="mt-3.5 flex items-start justify-center gap-2.5 text-left max-w-lg mx-auto px-2">
                <input
                  type="checkbox"
                  id="auth-checkbox"
                  checked={authorized}
                  onChange={e => setAuthorized(e.target.checked)}
                  disabled={scanning}
                  className="mt-0.5 rounded border-white/20 text-teal-500 focus:ring-teal-500 cursor-pointer w-4 h-4 flex-shrink-0 bg-white/10"
                />
                <label htmlFor="auth-checkbox" className="text-xs text-gray-500 leading-relaxed cursor-pointer select-none">
                  I confirm I am authorized to evaluate this domain&apos;s public security posture for defensive and compliance purposes under applicable cybersecurity laws.
                </label>
              </div>

              {/* Lookup status */}
              {lookupStatus && !error && (
                <p className="mt-3 text-green-600 text-sm text-center font-medium">{lookupStatus}</p>
              )}
              {lookupError && (
                <p className="mt-3 text-red-600 text-sm text-center">{lookupError}</p>
              )}

              {/* Interactive Country / Region Matches Selection */}
              {businessMatches && businessMatches.length > 0 && !scanning && (
                <div className="mt-5 bg-white rounded-2xl p-5 border border-navy-100 shadow-xl text-left animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-navy-950 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-teal-400" />
                      Select Country / Region Option
                    </p>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full font-semibold">
                      {businessMatches.length} found
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3.5">
                    We found multiple country and region websites for <span className="font-semibold text-navy-950">"{businessName}"</span>. Click the exact one you want to scan:
                  </p>
                  <div className="grid gap-2 max-h-60 overflow-y-auto pr-1">
                    {businessMatches.map((match, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDomain(match.domain);
                          setBusinessMatches([]);
                          setInputMode('domain');
                          executeScan(match.domain);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-navy-950 hover:bg-navy-50/50 transition-all text-left group shadow-sm hover:shadow"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl flex-shrink-0" title={match.country}>{match.flag}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-navy-950 truncate group-hover:text-teal-400 transition-colors">
                              {match.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate font-mono mt-0.5">
                              {match.domain} • <span className="text-gray-400 font-sans font-medium">{match.country}</span>
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-navy-950 bg-white px-3 py-1.5 rounded-lg border border-gray-200 group-hover:bg-navy-950 group-hover:text-white transition-all flex-shrink-0 ml-2">
                          Scan &rarr;
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-3 text-red-600 text-sm text-center">{error}</p>
              )}
            </form>
            )}

            <p className="text-xs text-gray-500 mt-4">
              Free • No signup required • Plain language results
            </p>
            {scanCount && scanCount > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                🔒 <span className="font-semibold text-teal-400">{scanCount.toLocaleString()}</span> websites scanned so far
              </p>
            )}
          </div>
        </section>

        {/* ── Trust bar ────────────────────────────────────────── */}
        <div className="py-6 px-6 border-y border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1.5">🏦 International Security Standards aligned</span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">🔒 African Data Protection laws mapped</span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">✅ No intrusive scanning — passive checks only</span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">🌍 Built for African businesses</span>
          </div>
        </div>

        {/* ── What we scan ────────────────────────────────────── */}
        <section className="py-16 px-6 relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="fade-up font-display font-bold text-2xl text-white text-center mb-2">
              What we check
            </h2>
            <p className="fade-up text-gray-400 text-center text-sm mb-10" style={{transitionDelay:'80ms'}}>
              {CHECKS_DISPLAY.length} automated security checks — results in plain business language, not technical jargon.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 stagger">
              {CHECKS_DISPLAY.slice(0, 5).map(({ icon: Icon, label }) => (
                <div key={label} className="fade-up card-teal p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-teal-500/30">
                    <Icon className="w-4 h-4 text-teal-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">{label}</span>
                </div>
              ))}
              <div className="fade-up card-teal p-4 flex flex-col justify-center items-center text-center bg-teal-900/20 border-teal-500/20">
                <span className="text-xl font-bold text-teal-400">+{CHECKS_DISPLAY.length - 5}</span>
                <span className="text-xs font-medium text-gray-400">more checks running in background</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ───────────────────────────────────────────── */}
        <section className="py-16 px-6 bg-white/5 border-y border-white/10">
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center stagger">
            {STATS.map(({ value, label }) => (
              <div key={label} className="fade-up">
                <div className="font-display font-bold text-4xl text-teal-400 mb-2">{value}</div>
                <p className="text-sm text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────────── */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="fade-up font-display font-bold text-2xl text-white text-center mb-2">
              Trusted by businesses across Africa
            </h2>
            <p className="fade-up text-gray-400 text-center text-sm mb-10" style={{transitionDelay:'80ms'}}>
              From fintech to retail — ScanVault helps businesses understand and improve their security.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 stagger">
              {[
                {
                  quote: "We had no idea our website was exposing sensitive headers until ScanVault flagged it. Fixed in one afternoon with the copy-paste instructions.",
                  name: "Ama Asante",
                  role: "IT Manager",
                  company: "Accra Fintech Ltd",
                  score: 87,
                },
                {
                  quote: "The compliance checker saved us weeks of manual work. We now know exactly where our gaps are for emerging data protection regulations.",
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
                <div key={i} className="fade-up card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(5)].map((_, s) => (
                        <svg key={s} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}, {t.company}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-teal-400">{t.score}</div>
                      <div className="text-xs text-gray-500">Security score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Africa compliance callout ─────────────────────────── */}
        <section className="py-16 px-6 bg-teal-gradient relative overflow-hidden">
          <div className="absolute inset-0 bg-navy-950/50" />
          <div className="max-w-3xl mx-auto text-center relative stagger">
            <Shield className="fade-up w-10 h-10 text-teal-300 mx-auto mb-4" />
            <h2 className="fade-up font-display font-bold text-3xl mb-4">
              Built for Africa's emerging cybersecurity standards
            </h2>
            <p className="fade-up text-gray-300 leading-relaxed mb-8 max-w-xl mx-auto">
              Emerging regulations across the continent
              now require businesses handling customer data to meet minimum security
              standards. Our compliance checker maps your gaps directly to these requirements.
            </p>
            <div className="fade-up flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/compliance" className="btn-primary">Check Compliance →</a>
              <a href="/report/demo" className="btn-outline border-white text-white hover:bg-white hover:text-navy-950">See a sample report</a>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────── */}
        <Footer />

      </main>
    </>
  );
}
