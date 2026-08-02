'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Could not connect. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-navy-950 flex items-center justify-center pt-20 pb-12 px-6 relative overflow-hidden">
        
        {/* Glow Orbs */}
        <div className="glow-orb-teal w-96 h-96 -top-48 -left-48 orb-float-a" />
        <div className="glow-orb-blue w-96 h-96 -bottom-48 -right-48 orb-float-b" />

        <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
          
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-teal-500/10 rounded-2xl border border-teal-500/30 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-teal-400" />
            </div>
            <h1 className="font-display font-bold text-3xl text-white">Welcome back</h1>
            <p className="text-gray-400 text-sm mt-2">Log in to manage your website security</p>
          </div>

          <div className="card-teal bg-white/5 border border-white/10 p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-teal-gradient opacity-50"></div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@yourbusiness.com"
                  className="w-full bg-navy-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all text-sm font-medium"
                  disabled={loading}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-navy-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all text-sm font-medium"
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 mt-2 text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 mt-4 rounded-xl shadow-teal-sm"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <Link href="/signup" className="text-teal-400 font-semibold hover:text-teal-300 transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
