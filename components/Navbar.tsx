'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  name: string | null;
  company: string | null;
  plan: string;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        router.push('/login');
        router.refresh();
      }
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-navy-100 print:hidden">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-navy-950 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-ghana-red" />
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="relative z-10">
              <rect x="5" y="10" width="10" height="8" rx="1.5" fill="white"/>
              <path d="M7 10V7.5a3 3 0 016 0V10" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <circle cx="10" cy="14" r="1.5" fill="#0A1628"/>
            </svg>
          </div>
          <span className="font-display font-bold text-xl text-navy-950 tracking-tight leading-none">
            Scan<span className="text-ghana-red">Vault</span>
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/compliance" className="text-sm text-gray-600 hover:text-navy-950 transition-colors hidden sm:block">
            Compliance Checker
          </Link>
          
          {!loading && user ? (
            <>
              <Link href="/dashboard" className="text-sm font-semibold text-navy-950 hover:text-navy-700 transition-colors">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/pricing" className="text-sm text-gray-600 hover:text-navy-950 transition-colors hidden sm:block">
                Pricing
              </Link>
              {!loading && (
                <Link href="/login" className="text-sm text-navy-950 hover:text-navy-700 font-medium transition-colors">
                  Login
                </Link>
              )}
              <Link href="/" className="btn-primary text-sm py-2 px-4">
                Free Scan
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
