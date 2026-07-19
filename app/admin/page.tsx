'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, Users, Search, RefreshCw, Eye, ArrowRight, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Metrics {
  totalUsers: number;
  totalScans: number;
  totalMonitored: number;
  avgScore: number;
}

interface ScanRecord {
  id: string;
  domain: string;
  score: number;
  status: string;
  created_at: string;
  user_email: string | null;
}

interface UserRecord {
  id: number;
  email: string;
  name: string | null;
  company: string | null;
  plan: string;
  created_at: string;
}

interface TrafficLog {
  id: number;
  path: string;
  action: string;
  metadata: any;
  country: string | null;
  region: string | null;
  city: string | null;
  created_at: string;
  user_email: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [traffic, setTraffic] = useState<TrafficLog[]>([]);
  
  // Tabs: 'users' | 'scans' | 'traffic'
  const [activeTab, setActiveTab] = useState<'users' | 'scans' | 'traffic'>('users');

  // Actions states
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const loadAdminData = () => {
    fetch('/api/admin/stats')
      .then(res => {
        if (res.status === 401) {
          router.push('/dashboard');
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => {
        setMetrics(data.metrics);
        setUsers(data.users);
        setScans(data.recentScans);
        setTraffic(data.traffic);
      })
      .catch(err => {
        console.error('Error loading admin data:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAdminData();
  }, [router]);

  const handleRunCron = async () => {
    setCronRunning(true);
    setCronResult('');
    try {
      // Vercel / route uses fallbacks if env is local. 
      // We trigger the cron endpoint directly.
      const res = await fetch('/api/monitor/cron', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer scanvault_cron_secret_auth_token_987654_xyz'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setCronResult(`Processed: ${JSON.stringify(data.processed || data)}`);
        loadAdminData();
      } else {
        setCronResult(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setCronResult(`Error: ${err.message}`);
    } finally {
      setCronRunning(false);
    }
  };

  const handleUpdatePlan = async (userId: number, newPlan: string) => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch('/api/admin/user/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan: newPlan }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update plan');
      }
    } catch {
      alert('Connection error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const formatLocation = (log: TrafficLog) => {
    if (!log.country) return 'Unknown location';
    const city = log.city ? `${log.city}, ` : '';
    const region = log.region ? `${log.region} ` : '';
    return `${city}${region}(${log.country})`;
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

  if (!metrics) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">

          {/* Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display font-bold text-3xl text-navy-950">Admin Operator</h1>
              <p className="text-gray-400 text-sm mt-1">ScanVault platform management controls</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleRunCron}
                disabled={cronRunning}
                className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
              >
                {cronRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Run Cron Audits
              </button>
            </div>
          </div>

          {cronResult && (
            <div className="mb-6 p-4 bg-navy-950 text-green-400 rounded-xl font-mono text-xs overflow-x-auto">
              {cronResult}
            </div>
          )}

          {/* Grid Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-5 bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Users</p>
              <span className="text-3xl font-display font-bold text-navy-950">{metrics.totalUsers}</span>
            </div>

            <div className="card p-5 bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Scans Run</p>
              <span className="text-3xl font-display font-bold text-navy-950">{metrics.totalScans}</span>
            </div>

            <div className="card p-5 bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Monitored Domains</p>
              <span className="text-3xl font-display font-bold text-navy-950">{metrics.totalMonitored}</span>
            </div>

            <div className="card p-5 bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Global Avg Score</p>
              <span className="text-3xl font-display font-bold text-navy-950">{metrics.avgScore}/100</span>
            </div>
          </div>

          {/* Tabs Selector */}
          <div className="flex bg-navy-100 rounded-xl p-1 mb-6 max-w-md">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${
                activeTab === 'users' ? 'bg-white text-navy-950 shadow-sm' : 'text-gray-500 hover:text-navy-950'
              }`}
            >
              👥 Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('scans')}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${
                activeTab === 'scans' ? 'bg-white text-navy-950 shadow-sm' : 'text-gray-500 hover:text-navy-950'
              }`}
            >
              🔎 Scans ({scans.length})
            </button>
            <button
              onClick={() => setActiveTab('traffic')}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${
                activeTab === 'traffic' ? 'bg-white text-navy-950 shadow-sm' : 'text-gray-500 hover:text-navy-950'
              }`}
            >
              🕵️ Visitor Logs
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="card bg-white border border-gray-100 shadow-sm overflow-hidden">
            
            {/* TABS 1: USERS */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                      <th className="px-6 py-3">User Details</th>
                      <th className="px-6 py-3">Company</th>
                      <th className="px-6 py-3">Date Registered</th>
                      <th className="px-6 py-3 text-right">Subscription Plan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-navy-950">{u.name || 'Anonymous User'}</div>
                          <div className="text-xs text-gray-400">{u.email}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{u.company || 'Not provided'}</td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {new Date(u.created_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <select
                            value={u.plan}
                            onChange={e => handleUpdatePlan(u.id, e.target.value)}
                            disabled={updatingUserId === u.id}
                            className="bg-navy-50 text-navy-950 text-xs font-semibold px-2 py-1 rounded border border-navy-100 outline-none"
                          >
                            <option value="free">Free</option>
                            <option value="starter">Starter</option>
                            <option value="pro">Pro</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABS 2: SCANS */}
            {activeTab === 'scans' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                      <th className="px-6 py-3">Scanned Website</th>
                      <th className="px-6 py-3 text-center">Score</th>
                      <th className="px-6 py-3">Scan Owner</th>
                      <th className="px-6 py-3">Scan Date</th>
                      <th className="px-6 py-3 text-right">Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {scans.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-navy-950">{s.domain}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 text-xs rounded border ${getScoreColorClass(s.score)}`}>
                            {s.score}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                          {s.user_email || <span className="text-gray-400 italic">Guest (Anonymous)</span>}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {new Date(s.created_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/report/${s.id}`} className="text-navy-950 hover:underline font-semibold text-xs inline-flex items-center gap-0.5">
                            View <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABS 3: TRAFFIC ("Eyes Everywhere") */}
            {activeTab === 'traffic' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                      <th className="px-6 py-3">Visitor Info / Location</th>
                      <th className="px-6 py-3">Action performed</th>
                      <th className="px-6 py-3">Page Path</th>
                      <th className="px-6 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {traffic.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-navy-950 flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {formatLocation(log)}
                          </div>
                          {log.user_email && (
                            <div className="text-[10px] text-navy-600 font-medium mt-0.5">
                              Logged in as: {log.user_email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded font-medium text-[10px] border ${
                            log.action === 'view_page'
                              ? 'text-gray-600 bg-gray-50 border-gray-100'
                              : log.action === 'run_scan'
                              ? 'text-green-700 bg-green-50 border-green-100'
                              : log.action === 'download_pdf'
                              ? 'text-blue-700 bg-blue-50 border-blue-100'
                              : 'text-amber-700 bg-amber-50 border-amber-100'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-gray-500 truncate max-w-[200px]" title={log.path}>
                          {log.path}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(log.created_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>
      </main>
    </>
  );
}
