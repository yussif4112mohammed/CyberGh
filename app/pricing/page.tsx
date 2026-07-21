'use client';
import { useState } from 'react';
import { CheckCircle, Shield, Zap, Building, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 'GHS 0',
    period: '',
    description: 'For any business wanting to know where they stand',
    icon: Shield,
    color: 'border-gray-200',
    cta: 'Start Free Scan',
    ctaHref: '/',
    ctaStyle: 'btn-outline',
    features: [
      'One-time website security scan',
      '12-point security check',
      'Plain-language findings report',
      'Fix instructions for every issue',
      'Ghana compliance score',
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
    price: 'GHS 250',
    period: '/month',
    description: 'For small businesses serious about protecting customer data',
    icon: Zap,
    color: 'border-ghana-red',
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
      'Ghana compliance checklist',
      'Email support',
    ],
    missing: [],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'GHS 600',
    period: '/month',
    description: 'For businesses needing deeper security and compliance evidence',
    icon: Building,
    color: 'border-navy-700',
    cta: 'Upgrade to Pro',
    ctaStyle: 'btn-secondary',
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
  price: 'GHS 2,000 – 8,000',
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
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6">

          <div className="text-center mb-12">
            <h1 className="font-display font-bold text-4xl text-navy-950 mb-3">
              Simple, transparent pricing
            </h1>
            <p className="text-gray-500 text-lg">
              Built for Ghanaian business budgets. No hidden fees, cancel anytime.
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {PLANS.map(plan => (
              <div key={plan.name} className={`card p-6 border-2 ${plan.color} relative hover:scale-[1.02] hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between`}>
                <div>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-ghana-red text-white text-xs font-bold px-3 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  <plan.icon className="w-7 h-7 text-navy-700 mb-3" />
                  <h2 className="font-display font-bold text-xl text-navy-950 mb-0.5">{plan.name}</h2>
                  <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                  <div className="mb-5">
                    <span className="font-display font-bold text-3xl text-navy-950">{plan.price}</span>
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  </div>

                  {plan.id === 'free' ? (
                    <a href={plan.ctaHref} className={`${plan.ctaStyle} w-full justify-center mb-6`}>
                      {plan.cta}
                    </a>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.id)}
                      disabled={loadingPlan !== null}
                      className={`${plan.ctaStyle} w-full justify-center mb-6 py-2.5 rounded-xl`}
                    >
                      {loadingPlan === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      ) : null}
                      {loadingPlan === plan.id ? 'Connecting...' : plan.cta}
                    </button>
                  )}

                  <ul className="space-y-2.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                    {plan.missing.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                        <div className="w-4 h-4 flex-shrink-0 mt-0.5 flex items-center justify-center">
                          <div className="w-3 h-px bg-gray-300" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Pentest */}
          <div className="card p-8 bg-navy-950 text-white mb-10">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex-1">
                <div className="text-xs font-semibold text-ghana-red mb-2 uppercase tracking-wider">Add-on Service</div>
                <h2 className="font-display font-bold text-2xl mb-2">{PENTEST.name}</h2>
                <p className="text-gray-300 text-sm mb-4">{PENTEST.description}</p>
                <ul className="space-y-2">
                  {PENTEST.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center sm:text-right flex-shrink-0">
                <div className="font-display font-bold text-2xl text-white mb-1">{PENTEST.price}</div>
                <p className="text-gray-400 text-sm mb-4">per engagement</p>
                <a href="/contact" className="btn-primary">Request a Quote</a>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Questions? WhatsApp us or{' '}
              <a href="/contact" className="text-navy-700 font-medium hover:underline">send a message</a>.
              We respond within 24 hours.
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
