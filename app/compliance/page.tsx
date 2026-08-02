'use client';
import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, Globe } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface CheckItem {
  id: string;
  question: string;
  why: string;
  fix: string;
  regulation: string;
  weight: 'critical' | 'high' | 'medium';
}

const CHECKS_BY_COUNTRY: Record<string, { name: string, frameworks: string, checks: CheckItem[] }> = {
  ghana: {
    name: 'Ghana',
    frameworks: 'Bank of Ghana CISD 2026 & DPA 843',
    checks: [
      {
        id: 'dp1',
        question: 'Do you have a written Privacy Policy that explains what customer data you collect and why?',
        why: 'The Data Protection Act 843 requires businesses to inform customers about data collection.',
        fix: 'Create a Privacy Policy page on your website. A lawyer can draft one, or start with a template and customize it.',
        regulation: 'DPA 843 — Section 18',
        weight: 'critical',
      },
      {
        id: 'dp2',
        question: 'Do you get explicit consent before collecting personal data (name, phone, email, ID, location)?',
        why: 'You must have a legal basis for collecting personal data under DPA 843. Consent is the most common basis.',
        fix: 'Add a clear checkbox to any form that collects personal data: "I agree to the Privacy Policy and consent to my data being processed."',
        regulation: 'DPA 843 — Section 19',
        weight: 'critical',
      },
      {
        id: 'dp3',
        question: 'Is all customer data stored inside Ghana, or with a provider that meets Ghana\'s data residency requirements?',
        why: 'The Bank of Ghana CISD 2026 requires that sensitive financial data be stored within Ghana.',
        fix: 'Check where your hosting provider\'s servers are located. Providers like Telecel Cloud, Ghana Cloud, and AWS Africa (Cape Town) are compliant options.',
        regulation: 'CISD 2026 — Section 4.2',
        weight: 'critical',
      },
      {
        id: 'cisd1',
        question: 'Does your website use HTTPS (SSL certificate)?',
        why: 'CISD 2026 requires encrypted transmission of all financial and personal data. HTTP sends data in plain text.',
        fix: 'Ask your hosting provider to install an SSL certificate. Most providers offer free SSL via Let\'s Encrypt.',
        regulation: 'CISD 2026 — Section 3.1',
        weight: 'critical',
      },
      {
        id: 'cisd2',
        question: 'Do you have a formal password policy for staff accounts (minimum length, complexity, regular changes)?',
        why: 'Weak passwords are the #1 cause of business account breaches in Ghana.',
        fix: 'Create a one-page password policy: minimum 12 characters, mix of letters/numbers/symbols, changed every 90 days, no password sharing.',
        regulation: 'CISD 2026 — Section 5.2',
        weight: 'high',
      },
      {
        id: 'cisd3',
        question: 'Do you use two-factor authentication (2FA) on your business email and key systems?',
        why: 'Even if a password is stolen, 2FA prevents unauthorized access. CISD 2026 requires this for financial system access.',
        fix: 'Enable 2FA on Google Workspace, Microsoft 365, your banking portal, and any accounting software. Use Google Authenticator or SMS.',
        regulation: 'CISD 2026 — Section 5.3',
        weight: 'critical',
      }
    ]
  },
  nigeria: {
    name: 'Nigeria',
    frameworks: 'Nigeria Data Protection Act (NDPA) 2023',
    checks: [
      {
        id: 'dp1',
        question: 'Do you have a published Privacy Policy detailing lawful basis for data processing?',
        why: 'The NDPA requires data controllers to provide transparent information about data processing activities.',
        fix: 'Publish a comprehensive Privacy Policy on your website detailing data collection, purpose, and user rights.',
        regulation: 'NDPA 2023 — Section 27',
        weight: 'critical',
      },
      {
        id: 'dp2',
        question: 'Have you appointed a Data Protection Officer (DPO)?',
        why: 'Required for organizations processing large scale personal data or sensitive data in Nigeria.',
        fix: 'Designate a qualified DPO within your organization or outsource to a certified firm. Publish their contact info.',
        regulation: 'NDPA 2023 — Section 32',
        weight: 'high',
      },
      {
        id: 'cisd1',
        question: 'Does your website use HTTPS (SSL certificate)?',
        why: 'Data in transit must be secured to prevent interception, a basic requirement for data security.',
        fix: 'Ensure SSL/TLS is enforced across all domains handling customer data.',
        regulation: 'NDPA 2023 — Section 39',
        weight: 'critical',
      },
      {
        id: 'dp3',
        question: 'Do you conduct Data Privacy Impact Assessments (DPIA) for new high-risk processing?',
        why: 'Required before implementing systems that pose high risks to data subjects.',
        fix: 'Create a process to evaluate risks before launching new tools or features that handle personal data.',
        regulation: 'NDPA 2023 — Section 28',
        weight: 'high',
      }
    ]
  },
  kenya: {
    name: 'Kenya',
    frameworks: 'Data Protection Act 2019 (DPA)',
    checks: [
      {
        id: 'dp1',
        question: 'Are you registered with the Office of the Data Protection Commissioner (ODPC)?',
        why: 'Mandatory for data controllers and processors operating in Kenya above the threshold.',
        fix: 'Register your business on the ODPC portal and pay the relevant fees.',
        regulation: 'DPA 2019 — Section 18',
        weight: 'critical',
      },
      {
        id: 'dp2',
        question: 'Do you obtain free, specific, and informed consent before processing personal data?',
        why: 'Consent must be explicit and withdrawal must be as easy as giving it.',
        fix: 'Implement clear opt-in mechanisms. Pre-ticked boxes are not valid consent under the DPA.',
        regulation: 'DPA 2019 — Section 32',
        weight: 'critical',
      },
      {
        id: 'dp3',
        question: 'Are you storing sensitive personal data locally in Kenya?',
        why: 'Certain categories of critical data must be processed through a server located in Kenya.',
        fix: 'Verify data residency of your cloud provider. Ensure health, financial, or state data is hosted locally.',
        regulation: 'DPA 2019 — Section 50',
        weight: 'high',
      },
      {
        id: 'cisd1',
        question: 'Is your web traffic encrypted (HTTPS)?',
        why: 'Technical safeguards must be implemented to secure personal data.',
        fix: 'Install and enforce SSL certificates on all web properties.',
        regulation: 'DPA 2019 — Section 41',
        weight: 'critical',
      }
    ]
  },
  south_africa: {
    name: 'South Africa',
    frameworks: 'Protection of Personal Information Act (POPIA)',
    checks: [
      {
        id: 'dp1',
        question: 'Do you have a PAIA manual available to the public?',
        why: 'Required under POPIA and the Promotion of Access to Information Act.',
        fix: 'Draft a PAIA manual detailing your data processing activities and publish it on your website.',
        regulation: 'POPIA / PAIA — Section 51',
        weight: 'high',
      },
      {
        id: 'dp2',
        question: 'Do you have a process to report data breaches to the Information Regulator and data subjects?',
        why: 'POPIA mandates breach notification as soon as reasonably possible.',
        fix: 'Develop an Incident Response Plan with a 72-hour notification timeline for the Information Regulator.',
        regulation: 'POPIA — Section 22',
        weight: 'critical',
      },
      {
        id: 'dp3',
        question: 'Is personal data deleted or de-identified when no longer needed?',
        why: 'Data minimization and retention limitation is a core POPIA condition.',
        fix: 'Implement automated data deletion policies for inactive accounts and old records.',
        regulation: 'POPIA — Condition 3 (Section 14)',
        weight: 'high',
      },
      {
        id: 'cisd1',
        question: 'Are appropriate, reasonable technical measures (like SSL and 2FA) in place to secure data?',
        why: 'Data controllers must secure integrity and confidentiality of personal information.',
        fix: 'Enforce HTTPS everywhere and require 2FA for all staff accessing databases.',
        regulation: 'POPIA — Section 19',
        weight: 'critical',
      }
    ]
  },
  other: {
    name: 'Other African Nations',
    frameworks: 'AU Malabo Convention Baseline',
    checks: [
      {
        id: 'dp1',
        question: 'Do you clearly explain what data you collect and how it is used?',
        why: 'A fundamental principle of the AU Convention is lawful and fair processing.',
        fix: 'Publish a clear, accessible Privacy Policy on your website.',
        regulation: 'Malabo Convention — Article 13',
        weight: 'critical',
      },
      {
        id: 'cisd1',
        question: 'Does your website use HTTPS (SSL certificate)?',
        why: 'Basic technical security is required to protect data against unauthorized access.',
        fix: 'Install an SSL certificate to encrypt traffic between your users and your servers.',
        regulation: 'Malabo Convention — Article 20',
        weight: 'critical',
      },
      {
        id: 'cisd3',
        question: 'Do you restrict access to customer data to only staff who need it?',
        why: 'Internal threats and compromised staff accounts are major vulnerabilities.',
        fix: 'Implement Role-Based Access Control (RBAC) and use Two-Factor Authentication (2FA).',
        regulation: 'Malabo Convention — Article 21',
        weight: 'high',
      },
      {
        id: 'dp2',
        question: 'Do you have a plan for responding to cybersecurity incidents or data breaches?',
        why: 'Preparation is necessary to mitigate damage and notify affected parties.',
        fix: 'Draft a simple Incident Response Plan outlining communication protocols if data is compromised.',
        regulation: 'Malabo Convention — Article 24',
        weight: 'medium',
      }
    ]
  }
};

export default function CompliancePage() {
  const [country, setCountry] = useState<string>('ghana');
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scanDomain, setScanDomain] = useState('');
  const [prefilled, setPrefilled] = useState(false);

  const currentFramework = CHECKS_BY_COUNTRY[country];
  const checks = currentFramework.checks;

  // Reset answers when country changes
  useEffect(() => {
    setAnswers({});
    setExpanded(null);
  }, [country]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const scanId = params.get('scanId');
    if (!scanId) return;

    fetch(`/api/scan/${scanId}`)
      .then(r => r.json())
      .then(data => {
        if (data.result) {
          const result = data.result;
          setScanDomain(result.domain);
          setPrefilled(true);

          const newAnswers: Record<string, boolean | null> = {};

          // Auto-answer logic (applies generically if ID matches)
          const sslFailed = result.findings.some((f: any) => f.category === 'ssl' && f.severity !== 'pass' && f.severity !== 'info');
          newAnswers['cisd1'] = !sslFailed;

          setAnswers(prev => ({ ...prev, ...newAnswers }));
        }
      })
      .catch(err => console.error('Failed to load pre-fill scan:', err));
  }, []);

  const answer = (id: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const answered = Object.keys(answers).length;
  const total = checks.length;
  const passed = Object.values(answers).filter(v => v === true).length;
  
  const score = answered === 0 ? 0 : Math.round((passed / total) * 100);

  const criticalFailed = checks.filter(c => c.weight === 'critical' && answers[c.id] === false);
  const highFailed = checks.filter(c => c.weight === 'high' && answers[c.id] === false);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-navy-950 relative overflow-hidden pt-24 pb-16">
        
        {/* Glow Orbs */}
        <div className="glow-orb-teal w-[500px] h-[500px] -top-64 -left-64 orb-float-a opacity-50" />
        <div className="glow-orb-blue w-[400px] h-[400px] top-48 -right-48 orb-float-b opacity-30" />

        <div className="max-w-3xl mx-auto px-6 relative z-10 animate-in fade-in duration-700 slide-in-from-bottom-4">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-teal-500/10 text-teal-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-teal-500/20">
              <Shield className="w-3.5 h-3.5" />
              Pan-African Compliance Readiness
            </div>
            <h1 className="font-display font-bold text-4xl text-white mb-4">
              Regional Security Checker
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto mb-8">
              Select your operating country below. Answer the plain-language questions, and we'll tell you exactly where your business stands against regional regulations.
            </p>

            {/* Country Selector */}
            <div className="max-w-xs mx-auto mb-4 relative">
              <label className="block text-left text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Operating Region</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400" />
                <select 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white appearance-none focus:outline-none focus:border-teal-500/50 transition-all font-medium"
                >
                  <option value="ghana" className="bg-navy-900">Ghana (DPA 843 / CISD)</option>
                  <option value="nigeria" className="bg-navy-900">Nigeria (NDPA)</option>
                  <option value="kenya" className="bg-navy-900">Kenya (DPA 2019)</option>
                  <option value="south_africa" className="bg-navy-900">South Africa (POPIA)</option>
                  <option value="other" className="bg-navy-900">Other African Nations (AU Framework)</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <span className="text-teal-300 text-sm font-medium">Currently testing against: </span>
            <span className="text-white font-bold bg-white/10 px-3 py-1 rounded-md text-sm ml-2 border border-white/10 shadow-sm">{currentFramework.frameworks}</span>
          </div>

          {/* Pre-fill Banner */}
          {prefilled && (
            <div className="card-teal bg-teal-500/10 border-l-4 border-l-teal-500 border-y-white/10 border-r-white/10 p-5 mb-6 flex items-start gap-3 backdrop-blur-sm">
              <Shield className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white text-sm">Answers Pre-filled</h3>
                <p className="text-xs text-gray-300 mt-0.5">
                  We've pre-filled some answers automatically based on the website security scan of <strong className="text-teal-300">{scanDomain}</strong>. You can manually change any answer if needed.
                </p>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="card-teal bg-white/5 border border-white/10 p-5 mb-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">{answered} of {total} answered</span>
              {answered > 0 && (
                <span className={`text-sm font-bold ${score >= 80 ? 'text-teal-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                  {score}% compliant
                </span>
              )}
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
              <div
                className="absolute top-0 left-0 h-full bg-teal-gradient rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                style={{ width: `${(answered / total) * 100}%` }}
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4 mb-12">
            {checks.map((check, i) => {
              const ans = answers[check.id];
              const isExpanded = expanded === check.id;

              return (
                <div key={check.id} className={`card-teal bg-white/5 overflow-hidden border-l-4 backdrop-blur-sm transition-all duration-300 ${
                  ans === true ? 'border-l-teal-400 border-y-white/10 border-r-white/10' :
                  ans === false ? 'border-l-red-400 border-y-white/10 border-r-white/10 bg-red-950/20' :
                  'border-l-white/10 border-y-white/10 border-r-white/10 hover:bg-white/10'
                }`}>
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-5">
                      <span className="text-xs font-bold text-gray-500 mt-1 flex-shrink-0 bg-white/5 px-2 py-1 rounded-md">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            check.weight === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            check.weight === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>{check.weight.charAt(0).toUpperCase() + check.weight.slice(1)} Priority</span>
                          <span className="text-xs font-medium text-gray-400 bg-black/20 px-2 py-0.5 rounded-full">{check.regulation}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-200 leading-relaxed">{check.question}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pl-12">
                      <button
                        onClick={() => answer(check.id, true)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                          ans === true
                            ? 'bg-teal-500/20 border-teal-500/50 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" /> Yes
                      </button>
                      <button
                        onClick={() => { answer(check.id, false); setExpanded(check.id); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                          ans === false
                            ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.1)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <XCircle className="w-4 h-4" /> No
                      </button>
                    </div>

                    {/* Expanded fix */}
                    {ans === false && (
                      <div className="mt-5 pl-12 space-y-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="bg-amber-950/30 rounded-xl p-4 border border-amber-500/20">
                          <p className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> Why this matters
                          </p>
                          <p className="text-sm text-gray-300 leading-relaxed">{check.why}</p>
                        </div>
                        <div className="bg-teal-950/30 rounded-xl p-4 border border-teal-500/20">
                          <p className="text-xs font-bold text-teal-400 mb-1 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" /> How to fix it
                          </p>
                          <p className="text-sm text-gray-300 leading-relaxed">{check.fix}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Results summary */}
          {answered === total && (
            <div className="card-teal p-10 bg-white/5 border border-white/10 backdrop-blur-md text-white text-center animate-in zoom-in duration-500">
              <Shield className="w-12 h-12 text-teal-400 mx-auto mb-5 drop-shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
              <div className="text-6xl font-display font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{score}%</div>
              <p className="text-teal-400 font-medium tracking-wide uppercase text-sm mb-3">compliance score</p>
              <p className="text-base text-gray-300 mb-8 max-w-lg mx-auto leading-relaxed">
                {criticalFailed.length > 0
                  ? `${criticalFailed.length} critical ${criticalFailed.length === 1 ? 'gap' : 'gaps'} need immediate attention to avoid regulatory penalties under ${currentFramework.name} law.`
                  : highFailed.length > 0
                  ? `${highFailed.length} high-priority ${highFailed.length === 1 ? 'gap' : 'gaps'} to address to ensure data security.`
                  : 'Great work — your business is well-positioned for compliance.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/contact" className="btn-primary py-3 px-8 text-base shadow-teal-lg">Get a Free Fix Plan</a>
                <a href="/" className="btn-outline border-white/20 text-white hover:bg-white/10 py-3 px-8 text-base">
                  Scan Your Website Too
                </a>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
