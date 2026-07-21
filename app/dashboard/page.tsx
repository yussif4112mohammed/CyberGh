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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Monitored Websites</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-display font-bold text-navy-950">{monitored.filter(m => m.verified).length}</span>
                <span className="text-xs text-gray-400">/ {monitored.length} verified</span>
              </div>
            </div>
          </div>

          {/* Monitoring & Scan History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Monitor website manager */}
            <div className="lg:col-span-1 space-y-6">
              <div className="card p-6 bg-white border border-gray-100 shadow-sm">
                <h2 className="font-display font-bold text-lg text-navy-950 mb-3">Monitor Websites</h2>
                <p className="text-xs text-gray-400 mb-4">Add websites to receive weekly automated scans and threat alerts.</p>
                
                <form onSubmit={handleAddMonitor} className="space-y-3 mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newDomain}
                      onChange={e => setNewDomain(e.target.value)}
                      placeholder="yourbusiness.com"
                      className="input flex-1 text-sm font-medium"
                      disabled={addingDomain}
                    />
                    <button
                      type="submit"
                      disabled={addingDomain || !newDomain.trim()}
                      className="btn-primary text-sm p-2.5 rounded-xl"
                    >
                      {addingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                  {monitorError && <p className="text-xs text-red-600">{monitorError}</p>}
                </form>

                {/* Monitored domains list */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Your Tracking List</p>
                  
                  {monitored.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No websites monitored yet. Add one above to schedule weekly checks.</p>
                  ) : (
                    monitored.map(item => (
                      <div key={item.id} className="flex flex-col p-3 bg-navy-50/50 border border-navy-100/50 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-sm font-semibold text-navy-950 truncate">{item.domain}</p>
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
                                className="p-1.5 text-gray-400 hover:text-navy-950 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"
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
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Verification badge trigger */}
                        <div className="pt-1 flex items-center">
                          {item.verified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-bold">
                              <CheckCircle className="w-3 h-3 text-green-600" /> Active Alert Monitor
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setVerifyError('');
                                setVerifySuccess('');
                                setSelectedVerifyDomain(item);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full font-bold cursor-pointer transition-all"
                            >
                              <HelpCircle className="w-3 h-3 text-amber-600" /> Verify Ownership
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {user.plan === 'free' && (
                <div className="card p-6 bg-navy-950 text-white shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10">
                    <Shield className="w-32 h-32 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">Unlock More Alerts</h3>
                  <p className="text-xs text-gray-300 leading-relaxed mb-4">
                    Upgrade to Starter (3 domains) or Pro (10 domains) to monitor your complete production and staging ecosystem.
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
                    <p className="text-xs text-gray-400 mt-1 mb-4">Enter a website URL under the monitoring list to trigger your first audit.</p>
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

          {/* ── Verification Instructions Modal ── */}
          {selectedVerifyDomain && (
            <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 bg-navy-950 text-white flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg">Verify Website Ownership</h3>
                    <p className="text-[10px] text-gray-300">Domain: {selectedVerifyDomain.domain}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedVerifyDomain(null)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    To activate active monitoring, weekly rescans, and alerts, prove that you own or manage this website by choosing one of the options below:
                  </p>

                  <div className="space-y-4">
                    {/* Option A */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider mb-2">Option A: File Upload (Easiest)</h4>
                      <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                        1. Create a plain text file named <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono font-semibold text-navy-950">scanvault.txt</code>
                        <br />
                        2. Paste this exact token inside it:
                      </p>
                      <div className="bg-navy-950 text-green-400 font-mono text-[10px] p-2.5 rounded-lg select-all break-all mb-3 border border-navy-900">
                        {selectedVerifyDomain.verification_token}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        3. Upload it so it is publicly accessible at:
                        <br />
                        <span className="font-mono text-[10px] text-navy-900 bg-white border border-gray-100 px-1 py-0.5 rounded break-all select-all">
                          https://{selectedVerifyDomain.domain}/.well-known/scanvault.txt
                        </span>
                      </p>
                    </div>

                    {/* Option B */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider mb-2">Option B: DNS TXT Record</h4>
                      <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                        Add a DNS TXT record to your domain's registrar (e.g. GoDaddy, Namecheap, Cloudflare):
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="col-span-1 text-gray-400 font-medium">Record Type:</div>
                        <div className="col-span-2 font-mono font-semibold text-navy-950">TXT</div>
                        
                        <div className="col-span-1 text-gray-400 font-medium">Host / Name:</div>
                        <div className="col-span-2 font-mono font-semibold text-navy-950">@ <span className="text-[10px] text-gray-400">(or leave empty)</span></div>
                        
                        <div className="col-span-1 text-gray-400 font-medium">Value / Content:</div>
                        <div className="col-span-2 font-mono font-semibold text-navy-950 bg-white border border-gray-100 p-1.5 rounded select-all break-all text-[10px]">
                          scanvault-verification={selectedVerifyDomain.verification_token}
                        </div>
                      </div>
                    </div>
                  </div>

                  {verifyError && (
                    <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg flex items-start gap-2 border border-red-100">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>{verifyError}</div>
                    </div>
                  )}

                  {verifySuccess && (
                    <div className="bg-green-50 text-green-700 text-xs p-3 rounded-lg flex items-start gap-2 border border-green-100">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>{verifySuccess}</div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerifyDomain(selectedVerifyDomain.id)}
                      disabled={verifying || verifySuccess !== ''}
                      className="btn-primary flex-1 justify-center py-2.5 rounded-xl text-sm"
                    >
                      {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                      {verifying ? 'Verifying...' : 'Verify Now'}
                    </button>
                    <button
                      onClick={() => setSelectedVerifyDomain(null)}
                      disabled={verifying}
                      className="btn-outline px-4 py-2.5 rounded-xl text-sm"
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
