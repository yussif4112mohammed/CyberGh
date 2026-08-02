'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, ArrowRight, Trash2, Plus, AlertCircle, RefreshCw, CheckCircle, HelpCircle, X } from 'lucide-react';
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

interface MonitoredDomain {
  id: number;
  domain: string;
  verified: boolean;
  verification_token: string;
  created_at: string;
  last_scan_at: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [monitored, setMonitored] = useState<MonitoredDomain[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Monitoring manage state
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [monitorError, setMonitorError] = useState('');
  
  // Quick scanning action
  const [rescanningDomain, setRescanningDomain] = useState<string | null>(null);

  // Verification modal state
  const [selectedVerifyDomain, setSelectedVerifyDomain] = useState<MonitoredDomain | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');

  const loadData = () => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/scan/history?user=true').then(r => r.json()),
      fetch('/api/monitor').then(r => r.json())
    ])
      .then(([userData, historyData, monitorData]) => {
        if (userData.user) {
          setUser(userData.user);
        } else {
          router.push('/login');
        }
        if (historyData.history) {
          setHistory(historyData.history);
        }
        if (monitorData.domains) {
          setMonitored(monitorData.domains);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleAddMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setAddingDomain(true);
    setMonitorError('');

    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMonitorError(data.error || 'Failed to add domain');
        setAddingDomain(false);
        return;
      }
      setNewDomain('');
      
      // Reload monitored list
      const monitorRes = await fetch('/api/monitor');
      const monitorData = await monitorRes.json();
      if (monitorData.domains) {
        setMonitored(monitorData.domains);
        
        // Find the newly added domain item to auto-open verification instructions
        const newlyAdded = monitorData.domains.find((d: MonitoredDomain) => d.domain === data.domain || d.verification_token === data.token);
        if (newlyAdded) {
          setSelectedVerifyDomain(newlyAdded);
        }
      }
    } catch {
      setMonitorError('Connection failed. Please try again.');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleRemoveMonitor = async (domain: string) => {
    if (!confirm(`Are you sure you want to disable continuous monitoring for ${domain}?`)) return;
    try {
      const res = await fetch(`/api/monitor?domain=${encodeURIComponent(domain)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMonitored(monitored.filter(m => m.domain !== domain));
      }
    } catch (err) {
      console.error('Failed to remove monitored domain:', err);
    }
  };

  const handleManualRescan = async (domain: string) => {
    setRescanningDomain(domain);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (data.scanId) {
        router.push(`/report/${data.scanId}`);
      }
    } catch {
      alert('Rescan failed. Check your internet connection.');
    } finally {
      setRescanningDomain(null);
    }
  };

  const handleVerifyDomain = async (domainId: number) => {
    setVerifying(true);
    setVerifyError('');
    setVerifySuccess('');
    try {
      const res = await fetch('/api/monitor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || 'Verification failed. Token not detected yet.');
        return;
      }
      setVerifySuccess(data.message || 'Website verified successfully!');
      
      // Reload monitored list
      const monitorRes = await fetch('/api/monitor');
      const monitorData = await monitorRes.json();
      if (monitorData.domains) {
        setMonitored(monitorData.domains);
      }

      // Automatically close modal after success
      setTimeout(() => {
        setSelectedVerifyDomain(null);
        setVerifySuccess('');
      }, 1800);
    } catch {
      setVerifyError('Verification request failed. Please check connection.');
    } finally {
      setVerifying(false);
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

  const completedScans = history.filter(h => h.status === 'complete');
  const avgScore = completedScans.length > 0
    ? Math.round(completedScans.reduce((acc, curr) => acc + curr.score, 0) / completedScans.length)
    : 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-navy-950 pt-24 pb-16 relative overflow-hidden">
        
        {/* Glow Orbs */}
        <div className="glow-orb-teal w-96 h-96 -top-48 -left-48 orb-float-a" />
        <div className="glow-orb-blue w-96 h-96 top-1/2 -right-48 orb-float-b" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display font-bold text-3xl text-white">
                Welcome back, {user.name || user.email.split('@')[0]}
              </h1>
              <p className="text-gray-400 text-sm mt-1">{user.company || 'Business Dashboard'}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-teal-400 bg-teal-400/10 border border-teal-400/20 px-3 py-1 rounded-full uppercase tracking-wider">
                {user.plan} plan
              </span>
              {user.plan === 'free' && (
                <Link href="/pricing" className="bg-teal-gradient hover:opacity-90 text-navy-950 font-bold text-xs py-1.5 px-4 rounded-full transition-all">
                  Upgrade
                </Link>
              )}
            </div>
          </div>

          {/* Grid stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="card-teal bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl p-6 rounded-2xl flex flex-col justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Scans Run</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-display font-bold text-white">{history.length}</span>
                <span className="text-xs text-teal-400">completed</span>
              </div>
            </div>

            <div className="card-teal bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl p-6 rounded-2xl flex flex-col justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Average Security Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-display font-bold text-white">{avgScore}</span>
                <span className="text-xs text-gray-400">/ 100</span>
              </div>
            </div>

            <div className="card-teal bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl p-6 rounded-2xl flex flex-col justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Monitored Websites</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-display font-bold text-white">{monitored.filter(m => m.verified).length}</span>
                <span className="text-xs text-gray-400">/ {monitored.length} verified</span>
              </div>
            </div>
          </div>

          {/* Monitoring & Scan History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Monitor website manager */}
            <div className="lg:col-span-1 space-y-6">
              <div className="card-teal bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-teal-gradient opacity-50"></div>
                <h2 className="font-display font-bold text-lg text-white mb-3">Monitor Websites</h2>
                <p className="text-xs text-gray-400 mb-4">Add websites to receive weekly automated scans and threat alerts.</p>
                
                <form onSubmit={handleAddMonitor} className="space-y-3 mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newDomain}
                      onChange={e => setNewDomain(e.target.value)}
                      placeholder="yourbusiness.com"
                      className="flex-1 bg-navy-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all text-sm font-medium"
                      disabled={addingDomain}
                    />
                    <button
                      type="submit"
                      disabled={addingDomain || !newDomain.trim()}
                      className="bg-teal-gradient hover:opacity-90 text-navy-950 p-2.5 rounded-xl transition-all disabled:opacity-50"
                    >
                      {addingDomain ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    </button>
                  </div>
                  {monitorError && <p className="text-xs text-red-400 bg-red-400/10 px-3 py-1.5 rounded-md border border-red-400/20">{monitorError}</p>}
                </form>

                {/* Monitored domains list */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Your Tracking List</p>
                  
                  {monitored.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No websites monitored yet. Add one above to schedule weekly checks.</p>
                  ) : (
                    monitored.map(item => (
                      <div key={item.id} className="flex flex-col p-3 bg-white/5 border border-white/10 rounded-xl space-y-2 group hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-sm font-semibold text-white truncate">{item.domain}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {item.last_scan_at
                                ? `Last scan: ${new Date(item.last_scan_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })}`
                                : 'Pending verification'}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {item.verified ? (
                              <button
                                onClick={() => handleManualRescan(item.domain)}
                                disabled={rescanningDomain !== null}
                                title="Rescan now"
                                className="p-1.5 text-gray-400 hover:text-teal-400 hover:bg-white/10 rounded-lg border border-transparent transition-all"
                              >
                                {rescanningDomain === item.domain ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ) : null}
                            <button
                              onClick={() => handleRemoveMonitor(item.domain)}
                              title="Remove monitoring"
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg border border-transparent transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Verification badge trigger */}
                        <div className="pt-1 flex items-center">
                          {item.verified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-teal-400 bg-teal-400/10 border border-teal-400/20 px-2 py-0.5 rounded-full font-bold">
                              <CheckCircle className="w-3 h-3 text-teal-400" /> Active Alert Monitor
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setVerifyError('');
                                setVerifySuccess('');
                                setSelectedVerifyDomain(item);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 px-2 py-0.5 rounded-full font-bold cursor-pointer transition-all"
                            >
                              <HelpCircle className="w-3 h-3 text-amber-400" /> Verify Ownership
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {user.plan === 'free' && (
                <div className="card-teal bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl p-6 rounded-2xl relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-5">
                    <Shield className="w-32 h-32 text-teal-400" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white mb-2">Unlock More Alerts</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4 relative z-10">
                    Upgrade to Starter (3 domains) or Pro (10 domains) to monitor your complete production and staging ecosystem.
                  </p>
                  <Link href="/pricing" className="text-sm font-semibold text-teal-400 inline-flex items-center gap-1.5 hover:text-teal-300 transition-colors hover:underline relative z-10">
                    View premium plans <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Scan history list */}
            <div className="lg:col-span-2">
              <div className="card-teal bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden h-full flex flex-col">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <h2 className="font-display font-bold text-lg text-white">Scan History</h2>
                  <span className="text-xs text-gray-500 font-medium">{history.length} records</span>
                </div>

                {history.length === 0 ? (
                  <div className="p-12 text-center flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                      <AlertCircle className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-sm text-white font-medium">No scans run on this account yet</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Enter a website URL under the monitoring list to trigger your first audit.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
                          <th className="px-6 py-4">Website Domain</th>
                          <th className="px-6 py-4 text-center">Security Score</th>
                          <th className="px-6 py-4">Scan Date</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {history.map(record => (
                          <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4 font-semibold text-white truncate max-w-[180px]">
                              {record.domain}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center justify-center font-bold px-2 py-1 text-xs rounded-md border ${
                                record.score >= 90 ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                                record.score >= 70 ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                                record.score >= 50 ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                                'text-red-400 bg-red-400/10 border-red-400/20'
                              }`}>
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
                                className="text-gray-400 hover:text-teal-400 font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                              >
                                View Report <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 transition-all duration-300" />
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

          {/* ── Verification Instructions Modal ── */}
          {selectedVerifyDomain && (
            <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-navy-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 bg-navy-950/50 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">Verify Website Ownership</h3>
                    <p className="text-[10px] text-gray-400">Domain: {selectedVerifyDomain.domain}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedVerifyDomain(null)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    To activate active monitoring, weekly rescans, and alerts, prove that you own or manage this website by choosing one of the options below:
                  </p>

                  <div className="space-y-4">
                    {/* Option A */}
                    <div className="bg-navy-950/50 border border-white/10 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Option A: File Upload (Easiest)</h4>
                      <p className="text-xs text-gray-400 mb-2 leading-relaxed">
                        1. Create a plain text file named <code className="bg-navy-900 px-1.5 py-0.5 rounded border border-white/10 font-mono font-semibold text-white">scanvault.txt</code>
                        <br />
                        2. Paste this exact token inside it:
                      </p>
                      <div className="bg-black/50 text-teal-400 font-mono text-[10px] p-2.5 rounded-lg select-all break-all mb-3 border border-white/5">
                        {selectedVerifyDomain.verification_token}
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        3. Upload it so it is publicly accessible at:
                        <br />
                        <span className="font-mono text-[10px] text-gray-300 bg-navy-900 border border-white/10 px-1.5 py-1 rounded break-all select-all mt-1 inline-block">
                          https://{selectedVerifyDomain.domain}/.well-known/scanvault.txt
                        </span>
                      </p>
                    </div>

                    {/* Option B */}
                    <div className="bg-navy-950/50 border border-white/10 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Option B: DNS TXT Record</h4>
                      <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                        Add a DNS TXT record to your domain's registrar (e.g. GoDaddy, Namecheap, Cloudflare):
                      </p>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="col-span-1 text-gray-500 font-medium">Record Type:</div>
                        <div className="col-span-2 font-mono font-semibold text-white">TXT</div>
                        
                        <div className="col-span-1 text-gray-500 font-medium">Host / Name:</div>
                        <div className="col-span-2 font-mono font-semibold text-white">@ <span className="text-[10px] text-gray-500">(or leave empty)</span></div>
                        
                        <div className="col-span-1 text-gray-500 font-medium">Value / Content:</div>
                        <div className="col-span-2 font-mono font-semibold text-teal-400 bg-black/50 border border-white/5 p-2 rounded select-all break-all text-[10px]">
                          scanvault-verification={selectedVerifyDomain.verification_token}
                        </div>
                      </div>
                    </div>
                  </div>

                  {verifyError && (
                    <div className="bg-red-400/10 text-red-400 text-xs p-3 rounded-lg flex items-start gap-2 border border-red-400/20">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>{verifyError}</div>
                    </div>
                  )}

                  {verifySuccess && (
                    <div className="bg-teal-400/10 text-teal-400 text-xs p-3 rounded-lg flex items-start gap-2 border border-teal-400/20">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>{verifySuccess}</div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVerifyDomain(selectedVerifyDomain.id)}
                      disabled={verifying || verifySuccess !== ''}
                      className="bg-teal-gradient hover:opacity-90 text-navy-950 font-bold flex-1 justify-center py-3 rounded-xl text-sm flex items-center transition-all disabled:opacity-50"
                    >
                      {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {verifying ? 'Verifying...' : 'Verify Now'}
                    </button>
                    <button
                      onClick={() => setSelectedVerifyDomain(null)}
                      disabled={verifying}
                      className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold px-6 py-3 rounded-xl text-sm transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
