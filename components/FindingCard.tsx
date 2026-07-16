'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';
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
};

interface FindingCardProps {
  finding: Finding;
  index: number;
}

export default function FindingCard({ finding, index }: FindingCardProps) {
  const [expanded, setExpanded] = useState(finding.severity === 'critical' || finding.severity === 'high');
  const config = SEVERITY_CONFIG[finding.severity];
  const Icon = config.icon;

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
            <div className="bg-navy-950 rounded-lg p-2">
              <p className="text-xs font-mono text-green-400 break-all">{finding.evidence}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
