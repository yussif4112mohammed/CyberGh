'use client';
import { useState } from 'react';
import { Send, Loader2, CheckCircle, Phone, Mail, MessageCircle, Shield, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';

const SERVICES = [
  'Free 30-min security consultation',
  'Website security scan report walkthrough',
  'Ghana Act 843 & CISD 2026 compliance assessment',
  'Manual penetration test quote',
  'Staff cybersecurity training',
  'Ongoing continuous monitoring subscription',
  'Other inquiry',
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', business: '', service: '', message: ''
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || 'Failed to send. Please email hello@scanvault.app directly.');
        setSending(false);
        return;
      }
      setSent(true);
    } catch {
      setSendError('Could not connect. Please email hello@scanvault.app directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50/70 pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-6">

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-red-50 text-ghana-red text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 border border-red-100 shadow-2xs">
              <Shield className="w-3.5 h-3.5" />
              Free 30-Minute Expert Consultation
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-navy-950 mb-4 tracking-tight">
              Let&apos;s Secure Your Business
            </h1>
            <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              30 minutes, no commitment, no sales pressure. We&apos;ll walk through your security report and create a custom hardening roadmap.
            </p>
          </div>

          {/* Contact methods */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: Mail, label: 'Email Support', value: 'hello@scanvault.app', sub: 'Direct engineering desk', href: 'mailto:hello@scanvault.app' },
              { icon: Phone, label: 'Call / WhatsApp', value: '+233 54 000 0000', sub: 'Accra & Lagos advisory', href: 'tel:+233540000000' },
              { icon: MessageCircle, label: 'Response Time', value: 'Within 24 Hours', sub: 'Guaranteed SLA for audits', href: null },
            ].map(item => (
              <div key={item.label} className="card p-5 text-center hover:border-navy-950 transition-all shadow-sm hover:shadow-md bg-white group">
                <div className="w-11 h-11 bg-navy-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-navy-950 transition-colors">
                  <item.icon className="w-5 h-5 text-navy-950 group-hover:text-white transition-colors" />
                </div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="text-sm font-bold text-navy-950 hover:text-ghana-red transition-colors block">{item.value}</a>
                ) : (
                  <p className="text-sm font-bold text-navy-950">{item.value}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{item.sub}</p>
              </div>
            ))}
          </div>

          {sent ? (
            <div className="card p-12 text-center bg-white shadow-xl shadow-navy-950/5 border border-gray-200">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="font-display font-bold text-2xl text-navy-950 mb-3">We&apos;ve Received Your Enquiry!</h2>
              <p className="text-gray-500 text-base max-w-md mx-auto mb-8 leading-relaxed">
                Thank you for reaching out! A senior cybersecurity specialist from our team will review your details and contact you within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="/" className="btn-primary text-sm px-6 py-3">Run Another Scan</a>
                <a href="/compliance" className="btn-outline text-sm px-6 py-3">Check Act 843 Compliance</a>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="card p-8 sm:p-10 space-y-6 bg-white shadow-xl shadow-navy-950/5 border border-gray-200">
              <div className="border-b border-gray-100 pb-5 mb-2">
                <h3 className="font-display font-bold text-lg text-navy-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-ghana-red" />
                  Consultation Request Form
                </h3>
                <p className="text-xs text-gray-500 mt-1">Fill out the details below and we will get in touch immediately.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-navy-950 mb-2">Your Name *</label>
                  <input required type="text"
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy-950 placeholder:text-gray-400 focus:bg-white focus:border-navy-950 focus:ring-2 focus:ring-navy-950/10 outline-none transition-all"
                    placeholder="e.g. Kwame Mensah"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy-950 mb-2">Business Name *</label>
                  <input required type="text"
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy-950 placeholder:text-gray-400 focus:bg-white focus:border-navy-950 focus:ring-2 focus:ring-navy-950/10 outline-none transition-all"
                    placeholder="e.g. Ecobank Ghana / Melcom"
                    value={form.business}
                    onChange={e => setForm({ ...form, business: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-navy-950 mb-2">Email Address *</label>
                  <input required type="email"
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy-950 placeholder:text-gray-400 focus:bg-white focus:border-navy-950 focus:ring-2 focus:ring-navy-950/10 outline-none transition-all"
                    placeholder="you@yourbusiness.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy-950 mb-2">Phone / WhatsApp</label>
                  <input type="tel"
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy-950 placeholder:text-gray-400 focus:bg-white focus:border-navy-950 focus:ring-2 focus:ring-navy-950/10 outline-none transition-all font-mono"
                    placeholder="e.g. +233 54 123 4567 or 024 123 4567"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-950 mb-2">What do you need help with? *</label>
                <select required
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy-950 focus:bg-white focus:border-navy-950 focus:ring-2 focus:ring-navy-950/10 outline-none transition-all cursor-pointer"
                  value={form.service}
                  onChange={e => setForm({ ...form, service: e.target.value })}>
                  <option value="" className="text-gray-400">Select an advisory or audit service...</option>
                  {SERVICES.map(s => <option key={s} value={s} className="text-navy-950">{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-950 mb-2">Tell us more <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea rows={4}
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy-950 placeholder:text-gray-400 focus:bg-white focus:border-navy-950 focus:ring-2 focus:ring-navy-950/10 outline-none transition-all leading-relaxed"
                  placeholder="Any specific concerns, your website URL, recent security incidents, or questions about Bank of Ghana Act 843 compliance..."
                  value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={sending} className="btn-primary w-full py-4 text-sm font-semibold justify-center rounded-xl shadow-md hover:shadow-lg transition-all">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Submitting Request...' : 'Book Free 30-Minute Consultation'}
                </button>
              </div>

              {sendError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
                  {sendError}
                </div>
              )}

              <p className="text-xs text-gray-400 text-center font-medium">
                🔒 100% Confidential. Your data is encrypted and never shared with third parties.
              </p>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
