'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, AlertCircle, Info, XCircle, Copy, Check } from 'lucide-react';
import { Finding, Severity } from '@/types/scan';

const SEVERITY_CONFIG: Record<Severity, { label: string; icon: any; classes: string; bg: string }> = {
  critical: { label: 'Critical', icon: XCircle,       classes: 'severity-critical', bg: 'bg-red-50 border-red-100' },
  high:     { label: 'High',     icon: AlertCircle,   classes: 'severity-high',     bg: 'bg-orange-50 border-orange-100' },
  medium:   { label: 'Medium',   icon: AlertTriangle, classes: 'severity-medium',   bg: 'bg-amber-50 border-amber-100' },
  low:      { label: 'Low',      icon: Info,          classes: 'severity-low',      bg: 'bg-blue-50 border-blue-100' },
  info:     { label: 'Info',     icon: Info,          classes: 'severity-info',     bg: 'bg-gray-50 border-gray-100' },
  pass:     { label: 'Pass',     icon: CheckCircle,   classes: 'severity-pass',     bg: 'bg-green-50 border-green-100' },
};

const CATEGORY_LABELS: Record<string, string> = {
  ssl:       'SSL/TLS',
  headers:   'Security Headers',
  paths:     'Exposed Files',
  dns:       'Email Security',
  ports:     'Open Ports',
  cookies:   'Cookies',
  breach:    'Data Breach',
  leakage:   'Info Leakage',
  wordpress: 'WordPress',
  redirect: 'HTTP Redirect',
  subdomain: 'Subdomain',
  directory: 'Directory Listing',
  fingerprint: 'Tech Stack',
};

interface FindingCardProps {
  finding: Finding;
  index: number;
}

export default function FindingCard({ finding, index }: FindingCardProps) {
  const [expanded, setExpanded] = useState(finding.severity === 'critical' || finding.severity === 'high');
  const [copied, setCopied] = useState(false);
  const config = SEVERITY_CONFIG[finding.severity];
  const Icon = config.icon;

  let currentValue = finding.evidence;
  let recommendedValue = '';

  if (finding.evidence?.includes('[RECOMMENDED:')) {
    const parts = finding.evidence.split('[RECOMMENDED:');
    currentValue = parts[0].replace('[DETECTED:', '').trim();
    if (currentValue.endsWith(']')) {
      currentValue = currentValue.slice(0, -1).trim();
    }
    recommendedValue = parts[1].replace(/\]$/, '').trim();
  }

  const copyFix = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(recommendedValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border ${config.bg} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3 hover:opacity-80 transition-opacity"
      >
        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${finding.severity === 'pass' ? 'text-green-600' : finding.severity === 'info' ? 'text-gray-500' : finding.severity === 'low' ? 'text-blue-600' : finding.severity === 'medium' ? 'text-amber-600' : finding.severity === 'high' ? 'text-orange-600' : 'text-red-600'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={config.classes}>{config.label}</span>
            <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
              {CATEGORY_LABELS[finding.category] || finding.category}
            </span>
          </div>
          <p className="text-sm font-medium text-navy-950 mt-1">{finding.title}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pl-11 space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">{finding.description}</p>
          {finding.fix && (
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs font-semibold text-navy-950 mb-1">How to fix this</p>
              <p className="text-sm text-gray-600 leading-relaxed">{finding.fix}</p>
            </div>
          )}
          {finding.evidence && (
            <div className="space-y-2">
              {currentValue && (
                <div className="bg-navy-950 rounded-lg p-3">
                  {recommendedValue && <p className="text-xs font-semibold text-gray-400 mb-1">Current value</p>}
                  <p className="text-xs font-mono text-green-400 break-all">{currentValue}</p>
                </div>
              )}
              {recommendedValue && (
                <div className="bg-white border border-gray-200 rounded-lg p-3 relative group">
                  <p className="text-xs font-semibold text-navy-950 mb-2">Copy-paste fix</p>
                  <div className="bg-gray-50 rounded p-2 border border-gray-100 pr-10">
                    <p className="text-xs font-mono text-navy-900 break-all">{recommendedValue}</p>
                  </div>
                  <button
                    onClick={copyFix}
                    className="absolute bottom-5 right-5 p-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
