import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'ScanVault — Free Website Security Scanner for Ghanaian Businesses', template: '%s | ScanVault' },
  description: 'Instantly check your website for security vulnerabilities, SSL issues, and compliance gaps with Ghana\'s Data Protection Act and Bank of Ghana CISD 2026 directive. Free scan, no signup required.',
  keywords: ['cybersecurity Ghana', 'website security scanner', 'Ghana Data Protection Act', 'CISD 2026', 'SME security', 'vulnerability scanner Africa'],
  openGraph: {
    type: 'website',
    siteName: 'ScanVault',
    locale: 'en_GH',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
