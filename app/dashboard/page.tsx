'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, ArrowRight, RefreshCw, AlertCircle, Plus } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface User {
  id: number;
  email: string;
  name: string | null;
  company: string | null;
  plan: string;
}

interface ScanRecord {
  id: string;
  domain: string;
  score: number;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quick scan state
  const [scanDomain, setScanDomain] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    // Load auth user and history parallelly
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/scan/history?user=true').then(r => r.json())
    ])
      .then(([userData, historyData]) => {
        if (userData.user) {
          setUser(userData.user);
        } else {
          router.push('/login');
        }
        if (historyData.history) {
          setHistory(historyData.history);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleQuickScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanDomain.trim()) return;
    setScanning(true);
    setScanError('');

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: scanDomain.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScanError(data.error || 'Scan failed');
        setScanning(false);
        return;
      }
      if (data.scanId) {
        router.push(`/report/${data.scanId}`);
      }
    } catch {
      setScanError('Failed to run scan. Check your internet connection.');
      setScanning(false);
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-100';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-navy-950 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // Aggregate values
  const completedScans = history.filter(h => h.status === 'complete');
  const avgScore = completedScans.length > 0
    ? Math.round(completedScans.reduce((acc, curr) => acc + curr.score, 0) / completedScans.length)
    : 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display font-bold text-3xl text-navy-950">
                Welcome back, {user.name || user.email.split('@')[0]}
              </h1>
              <p className="text-gray-400 text-sm mt-1">{user.company || 'Business Dashboard'}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-navy-700 bg-navy-100 px-3 py-1 rounded-full uppercase tracking-wider">
                {user.plan} plan
              </span>
              {user.plan === 'free' && (
                <Link href="/pricing" className="btn-primary text-xs py-1 px-3">
                  Upgrade
                </Link>
              )}
            </div>
          </div>

          {/* Grid stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="card p-6 bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Scans Run</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-display font-bold text-navy-950">{history.length}</span>
                <span className="text-xs text-gray-400">completed</span>
              </div>
            </div>

            <div className="card p-6 bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Average Security Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-display font-bold text-navy-950">{avgScore}</span>
                <span className="text-xs text-gray-400">/ 100</span>
              </div>
            </div>

            <div className="card p-6 bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Latest Website Scanned</p>
              <div className="truncate text-navy-950 font-medium text-lg mt-2">
                {history.length > 0 ? history[0].domain : 'No scans run yet'}
              </div>
            </div>
          </div>

          {/* Quick scan & Scan History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Quick scan card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="card p-6 bg-white border border-gray-100 shadow-sm">
                <h2 className="font-display font-bold text-lg text-navy-950 mb-3">Quick scan a site</h2>
                <p className="text-xs text-gray-400 mb-4">Run a passive scan on any domain to add it to your dashboard.</p>
                <form onSubmit={handleQuickScan} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={scanDomain}
                    onChange={e => setScanDomain(e.target.value)}
                    placeholder="yourbusiness.com.gh"
                    className="input w-full text-sm font-medium"
                    disabled={scanning}
                  />
                  {scanError && <p className="text-xs text-red-600">{scanError}</p>}
                  <button
                    type="submit"
                    disabled={scanning || !scanDomain.trim()}
                    className="btn-primary w-full justify-center text-sm py-2.5"
                  >
                    {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {scanning ? 'Running scan...' : 'Add & Scan Domain'}
                  </button>
                </form>
              </div>
              
              {user.plan === 'free' && (
                <div className="card p-6 bg-navy-950 text-white shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10">
                    <Shield className="w-32 h-32 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">Continuous Monitoring</h3>
                  <p className="text-xs text-gray-300 leading-relaxed mb-4">
                    Upgrade to Starter or Pro to configure weekly automated rescans, custom reporting alerts, and domain verification checks.
                  </p>
                  <Link href="/pricing" className="text-sm font-semibold text-white inline-flex items-center gap-1.5 hover:underline">
                    View premium plans <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Scan history list */}
            <div className="lg:col-span-2">
              <div className="card bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-display font-bold text-lg text-navy-950">Scan History</h2>
                  <span className="text-xs text-gray-400 font-medium">{history.length} records</span>
                </div>

                {history.length === 0 ? (
                  <div className="p-12 text-center">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-navy-950 font-medium">No scans run on this account yet</p>
                    <p className="text-xs text-gray-400 mt-1 mb-4">Enter a website URL above to run your first automated check.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                          <th className="px-6 py-3">Website Domain</th>
                          <th className="px-6 py-3 text-center">Security Score</th>
                          <th className="px-6 py-3">Scan Date</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {history.map(record => (
                          <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-navy-950 truncate max-w-[180px]">
                              {record.domain}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 text-xs rounded border ${getScoreColorClass(record.score)}`}>
                                {record.score}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-400">
                              {new Date(record.created_at).toLocaleDateString('en-GH', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link
                                href={`/report/${record.id}`}
                                className="text-navy-950 hover:text-navy-700 font-semibold text-xs inline-flex items-center gap-1"
                              >
                                View Report <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </main>
    </>
  );
}
