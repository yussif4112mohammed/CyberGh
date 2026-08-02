'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, Shield, Zap, Building, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    description: 'For any business wanting to know where they stand',
    icon: Shield,
    color: 'border-white/10 bg-white/5',
    cta: 'Start Free Scan',
    ctaHref: '/',
    ctaStyle: 'btn-outline border-white/20 text-white hover:bg-white/10',
    features: [
      'One-time website security scan',
      '12-point security check',
      'Plain-language findings report',
      'Fix instructions for every issue',
      'Regional compliance score',
    ],
    missing: [
      'Continuous monitoring',
      'Weekly staff security tips',
      'Monthly compliance reports',
      'Priority support',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$15',
    period: '/month',
    description: 'For small businesses serious about protecting customer data',
    icon: Zap,
    color: 'border-teal-500/50 bg-teal-500/5 shadow-[0_0_15px_rgba(20,184,166,0.15)]',
    badge: 'Most Popular',
    cta: 'Get Started',
    ctaStyle: 'btn-primary',
    features: [
      'Everything in Free',
      'Weekly automated rescans',
      'Change detection threat alerts',
      'SSL expiry warnings (14 days ahead)',
      'Weekly staff security tip emails',
      'Monthly security summary PDF',
      'Regional compliance checklist',
      'Email support',
    ],
    missing: [],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$40',
    period: '/month',
    description: 'For businesses needing deeper security and compliance evidence',
    icon: Building,
    color: 'border-white/10 bg-white/5',
    cta: 'Upgrade to Pro',
    ctaStyle: 'bg-white/10 text-white hover:bg-white/20 font-semibold transition-all',
    features: [
      'Everything in Starter',
      'Extended domain limits (up to 10 sites)',
      'Deep vulnerability scanning (OWASP Top 10)',
      'Staff phishing simulation tests',
      'Compliance gap report for DPC registration',
      'Incident response plan template',
      'Priority phone + WhatsApp support',
      'Annual security certificate',
    ],
    missing: [],
  },
];

const PENTEST = {
  name: 'Manual Penetration Test',
  price: '$200 – $600',
  description: 'A human expert manually tests your systems — the gold standard for compliance evidence, investor due diligence, or after a security incident.',
  features: [
    'Full manual pentest by a certified professional',
    'OWASP-standard methodology',
    'Executive summary + technical report',
    'Fix verification retest included',
    'Letter of attestation for regulators/banks',
    'Turnaround: 5–10 business days',
  ],
};

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // ── Scroll-triggered animations ──────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.fade-up, .slide-left, .slide-right, .stagger > *').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleCheckout = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      
      if (!authData.user) {
        window.location.href = `/login?redirect=/pricing`;
        return;
      }
      
      const checkoutRes = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      const checkoutData = await checkoutRes.json();
      
      if (checkoutRes.ok && checkoutData.authorization_url) {
        window.location.href = checkoutData.authorization_url;
      } else {
        alert(checkoutData.error || 'Failed to start payment checkout session');
      }
    } catch {
      alert('Payment initialization failed. Check your internet connection.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-navy-950 relative overflow-hidden pt-24 pb-16">
        
        {/* Glow Orbs */}
        <div className="glow-orb-teal w-96 h-96 -top-48 -left-48 orb-float-a" />
        <div className="glow-orb-blue w-96 h-96 -top-48 -right-48 orb-float-b" />

        <div className="max-w-5xl mx-auto px-6 relative">

          <div className="text-center mb-12 fade-up">
            <h1 className="font-display font-bold text-4xl text-white mb-3">
              Simple, transparent pricing
            </h1>
            <p className="text-gray-400 text-lg">
              Built for African business budgets. No hidden fees, cancel anytime.
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 stagger">
            {PLANS.map(plan => (
              <div key={plan.name} className={`fade-up rounded-2xl p-6 border ${plan.color} backdrop-blur-sm relative hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between`}>
                <div>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-teal-gradient text-white shadow-teal-sm text-xs font-bold px-3 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                    <plan.icon className={`w-6 h-6 ${plan.id === 'starter' ? 'text-teal-400' : 'text-gray-300'}`} />
                  </div>
                  <h2 className="font-display font-bold text-xl text-white mb-0.5">{plan.name}</h2>
                  <p className="text-gray-400 text-sm mb-4 min-h-[40px]">{plan.description}</p>
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <span className="font-display font-bold text-4xl text-white">{plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.id === 'starter' ? 'text-teal-400' : 'text-gray-500'}`} />
                        {f}
                      </li>
                    ))}
                    {plan.missing.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <div className="w-4 h-4 flex-shrink-0 mt-0.5 flex items-center justify-center">
                          <div className="w-3 h-px bg-gray-700" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {plan.id === 'free' ? (
                  <a href={plan.ctaHref} className={`w-full text-center py-3 rounded-xl flex items-center justify-center ${plan.ctaStyle}`}>
                    {plan.cta}
                  </a>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loadingPlan !== null}
                    className={`w-full text-center py-3 rounded-xl flex items-center justify-center ${plan.ctaStyle}`}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : null}
                    {loadingPlan === plan.id ? 'Connecting...' : plan.cta}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pentest */}
          <div className="fade-up rounded-3xl p-8 bg-white/5 border border-white/10 backdrop-blur-sm text-white mb-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-teal-gradient opacity-30"></div>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex-1">
                <div className="text-xs font-semibold text-teal-400 mb-2 uppercase tracking-wider">Enterprise Add-on Service</div>
                <h2 className="font-display font-bold text-2xl mb-2">{PENTEST.name}</h2>
                <p className="text-gray-400 text-sm mb-5 max-w-2xl">{PENTEST.description}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {PENTEST.features.map(f => (
                    <div key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-left sm:text-right flex-shrink-0 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/10 w-full sm:w-auto">
                <div className="font-display font-bold text-3xl text-white mb-1">{PENTEST.price}</div>
                <p className="text-gray-500 text-sm mb-5">per engagement</p>
                <a href="/contact" className="btn-outline border-white text-white hover:bg-white hover:text-navy-950 px-6">Request a Quote</a>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="text-center fade-up pb-8">
            <p className="text-gray-400 text-sm">
              Questions? WhatsApp us or{' '}
              <a href="/contact" className="text-teal-400 font-medium hover:underline">send a message</a>.
              We respond within 24 hours.
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
