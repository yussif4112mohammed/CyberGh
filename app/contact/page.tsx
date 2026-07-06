'use client';
import { useState } from 'react';
import { Send, Loader2, CheckCircle, Phone, Mail, MessageCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

const SERVICES = [
  'Free 30-min security consultation',
  'Website security scan report walkthrough',
  'Ghana compliance gap assessment',
  'Manual penetration test quote',
  'Staff security training',
  'Ongoing monitoring subscription',
  'Other',
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', business: '', service: '', message: ''
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const subject = encodeURIComponent(`CyberGH Enquiry — ${form.service || 'General'} — ${form.business}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nBusiness: ${form.business}\nService: ${form.service}\n\nMessage:\n${form.message}`
    );
    window.location.href = `mailto:hello@cybergh.app?subject=${subject}&body=${body}`;
    setTimeout(() => { setSending(false); setSent(true); }, 600);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-6">

          <div className="text-center mb-10">
            <h1 className="font-display font-bold text-4xl text-navy-950 mb-3">
              Book a Free Consultation
            </h1>
            <p className="text-gray-500">
              30 minutes, no commitment. We'll walk through your security report and
              create a clear fix plan for your business.
            </p>
          </div>

          {/* Contact methods */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: Mail, label: 'Email', value: 'hello@cybergh.app' },
              { icon: Phone, label: 'Call/WhatsApp', value: '+233 XX XXX XXXX' },
              { icon: MessageCircle, label: 'Response time', value: 'Within 24 hours' },
            ].map(item => (
              <div key={item.label} className="card p-4 text-center">
                <item.icon className="w-5 h-5 text-navy-700 mx-auto mb-2" />
                <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                <p className="text-xs font-medium text-navy-950">{item.value}</p>
              </div>
            ))}
          </div>

          {sent ? (
            <div className="card p-10 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="font-display font-bold text-xl text-navy-950 mb-2">Message sent!</h2>
              <p className="text-gray-500 text-sm">
                Your email app should have opened. We'll get back to you within 24 hours.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Didn't open? Email us directly at hello@cybergh.app
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="card p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name *</label>
                  <input required type="text" className="input" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name *</label>
                  <input required type="text" className="input" value={form.business}
                    onChange={e => setForm({ ...form, business: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input required type="email" className="input" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone / WhatsApp</label>
                  <input type="tel" className="input" placeholder="+233 XX XXX XXXX" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">What do you need help with? *</label>
                <select required className="input" value={form.service}
                  onChange={e => setForm({ ...form, service: e.target.value })}>
                  <option value="">Select a service...</option>
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tell us more (optional)</label>
                <textarea rows={4} className="input" placeholder="Any specific concerns, your website URL, or questions you have..."
                  value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>
              <button type="submit" disabled={sending} className="btn-primary w-full justify-center">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Message
              </button>
              <p className="text-xs text-gray-400 text-center">
                Free consultation — no commitment, no sales pressure.
              </p>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
