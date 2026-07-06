'use client';
import { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface CheckItem {
  id: string;
  question: string;
  why: string;
  fix: string;
  regulation: string;
  weight: 'critical' | 'high' | 'medium';
}

const CHECKS: CheckItem[] = [
  // ── Data Protection Act 843 ──────────────────────────────────
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
    regulation: 'CISD 2026 — Section 4.2, DPA 843 — Section 43',
    weight: 'critical',
  },
  {
    id: 'dp4',
    question: 'Have you registered with the Data Protection Commission (DPC)?',
    why: 'Any business that processes personal data must register with the DPC. Operating without registration is a criminal offense.',
    fix: 'Register at app.dataprotection.org.gh. The process takes about 30 minutes and costs a small fee.',
    regulation: 'DPA 843 — Section 27',
    weight: 'critical',
  },
  {
    id: 'dp5',
    question: 'Can customers request to see, correct, or delete their personal data?',
    why: 'DPA 843 gives individuals the right to access and correct their personal data.',
    fix: 'Add a "Data Request" contact email to your Privacy Policy, and create a process for handling these requests within 21 days.',
    regulation: 'DPA 843 — Section 33-35',
    weight: 'high',
  },
  // ── CISD 2026 ────────────────────────────────────────────────
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
  },
  {
    id: 'cisd4',
    question: 'Do you take regular backups of your business data, stored in a separate location?',
    why: 'Ransomware and system failures can destroy years of business data. CISD 2026 requires backup procedures.',
    fix: 'Set up automatic daily backups to a cloud service (Google Drive, Dropbox) or external drive kept offsite. Test your backup monthly.',
    regulation: 'CISD 2026 — Section 6.1',
    weight: 'high',
  },
  {
    id: 'cisd5',
    question: 'Do you have a written Incident Response Plan (what to do if you get hacked)?',
    why: 'CISD 2026 requires businesses to have a documented plan for responding to cybersecurity incidents.',
    fix: 'Create a simple one-page plan: who to contact first (IT, management, bank), how to isolate affected systems, how to notify affected customers, and how to report to the DPC within 72 hours.',
    regulation: 'CISD 2026 — Section 7.1',
    weight: 'high',
  },
  {
    id: 'cisd6',
    question: 'Do staff receive any cybersecurity awareness training (at least once a year)?',
    why: 'Human error causes over 80% of cybersecurity incidents. Untrained staff are the biggest risk.',
    fix: 'Run a 1-hour annual training covering: spotting phishing emails, safe password practices, what to do if something looks wrong. We offer affordable staff training packages.',
    regulation: 'CISD 2026 — Section 8.2',
    weight: 'medium',
  },
  {
    id: 'cisd7',
    question: 'Do you control who has access to sensitive customer data (role-based access)?',
    why: 'Not every staff member needs access to all customer data. Limiting access reduces the damage from insider threats and mistakes.',
    fix: 'Review who has access to what. Only give staff access to the systems and data they need for their job. Remove access immediately when someone leaves.',
    regulation: 'CISD 2026 — Section 5.1, DPA 843 — Section 32',
    weight: 'high',
  },
];

export default function CompliancePage() {
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const answer = (id: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const answered = Object.keys(answers).length;
  const total = CHECKS.length;
  const passed = Object.values(answers).filter(v => v === true).length;
  const failed = Object.values(answers).filter(v => v === false).length;

  const score = answered === 0 ? 0 : Math.round((passed / total) * 100);

  const criticalFailed = CHECKS.filter(c => c.weight === 'critical' && answers[c.id] === false);
  const highFailed = CHECKS.filter(c => c.weight === 'high' && answers[c.id] === false);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-red-50 text-ghana-red text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-red-100">
              <AlertTriangle className="w-3 h-3" />
              Bank of Ghana CISD 2026 + Data Protection Act 843
            </div>
            <h1 className="font-display font-bold text-4xl text-navy-950 mb-3">
              Ghana Compliance Checker
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto">
              Answer {total} plain-language questions. We'll tell you exactly where your business
              stands against Ghana's cybersecurity regulations — and what to fix first.
            </p>
          </div>

          {/* Progress */}
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-navy-950">{answered} of {total} answered</span>
              {answered > 0 && (
                <span className={`text-sm font-bold ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                  {score}% compliant
                </span>
              )}
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-navy-950 rounded-full transition-all duration-500"
                style={{ width: `${(answered / total) * 100}%` }}
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4 mb-8">
            {CHECKS.map((check, i) => {
              const ans = answers[check.id];
              const isExpanded = expanded === check.id;

              return (
                <div key={check.id} className={`card overflow-hidden border-l-4 ${
                  ans === true ? 'border-l-green-500' :
                  ans === false ? 'border-l-red-500' :
                  'border-l-gray-200'
                }`}>
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-xs font-semibold text-gray-400 mt-0.5 flex-shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            check.weight === 'critical' ? 'bg-red-50 text-red-700' :
                            check.weight === 'high' ? 'bg-orange-50 text-orange-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>{check.weight.charAt(0).toUpperCase() + check.weight.slice(1)}</span>
                          <span className="text-xs text-gray-400">{check.regulation}</span>
                        </div>
                        <p className="text-sm font-medium text-navy-950 leading-relaxed">{check.question}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pl-7">
                      <button
                        onClick={() => answer(check.id, true)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          ans === true
                            ? 'bg-green-600 text-white'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" /> Yes
                      </button>
                      <button
                        onClick={() => { answer(check.id, false); setExpanded(check.id); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          ans === false
                            ? 'bg-red-600 text-white'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        <XCircle className="w-4 h-4" /> No
                      </button>
                    </div>

                    {/* Expanded fix */}
                    {ans === false && (
                      <div className="mt-4 pl-7 space-y-2">
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                          <p className="text-xs font-semibold text-amber-800 mb-1">Why this matters</p>
                          <p className="text-sm text-amber-900">{check.why}</p>
                        </div>
                        <div className="bg-navy-50 rounded-xl p-4 border border-navy-100">
                          <p className="text-xs font-semibold text-navy-800 mb-1">How to fix it</p>
                          <p className="text-sm text-navy-900">{check.fix}</p>
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
            <div className="card p-8 bg-navy-950 text-white text-center">
              <Shield className="w-10 h-10 text-ghana-red mx-auto mb-4" />
              <div className="text-5xl font-display font-bold mb-1">{score}%</div>
              <p className="text-gray-300 mb-2">compliance score</p>
              <p className="text-sm text-gray-400 mb-6">
                {criticalFailed.length > 0
                  ? `${criticalFailed.length} critical ${criticalFailed.length === 1 ? 'gap' : 'gaps'} need immediate attention to avoid regulatory penalties.`
                  : highFailed.length > 0
                  ? `${highFailed.length} high-priority ${highFailed.length === 1 ? 'gap' : 'gaps'} to address.`
                  : 'Great work — your business is well-positioned for compliance.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="/contact" className="btn-primary">Get a Free Fix Plan</a>
                <a href="/" className="btn-outline border-white text-white hover:bg-white hover:text-navy-950">
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
