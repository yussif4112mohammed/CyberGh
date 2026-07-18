export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'pass';
export type ScanStatus = 'pending' | 'running' | 'complete' | 'failed';
export type Category = 'ssl' | 'headers' | 'paths' | 'dns' | 'ports' | 'breach' | 'cookies' | 'leakage' | 'wordpress' | 'redirect' | 'subdomain' | 'directory' | 'fingerprint';

export interface Finding {
  id?: number;
  scan_id?: string;
  category: Category;
  severity: Severity;
  title: string;
  description: string;
  fix: string;
  evidence?: string;
}

export interface ScanLog {
  step_name: string;
  status: 'success' | 'failed';
  duration_ms: number;
  error_msg?: string;
}

export interface ScanResult {
  id: string;
  domain: string;
  score: number;
  status: ScanStatus;
  findings: Finding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    pass: number;
  };
  created_at: string;
  completed_at?: string;
  duration_ms?: number;
  ip_address?: string;
  previous_scan_id?: string | null;
  user_id?: number | null;
  logs?: ScanLog[];
}
