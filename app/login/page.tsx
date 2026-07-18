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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 pb-12 px-6">
        <div className="w-full max-w-md">
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-navy-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-display font-bold text-3xl text-navy-950">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-2">Log in to manage your website security</p>
          </div>

          <div className="card p-8 bg-white border border-gray-100 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-navy-950 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@yourbusiness.com"
                  className="input"
                  disabled={loading}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-navy-950 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input"
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link href="/signup" className="text-navy-950 font-semibold hover:underline">
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
