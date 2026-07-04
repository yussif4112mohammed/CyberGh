'use client';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-navy-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-navy-950 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-navy-950 text-lg tracking-tight">
            Cyber<span className="text-ghana-red">GH</span>
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/compliance" className="text-sm text-gray-600 hover:text-navy-950 transition-colors hidden sm:block">
            Compliance Checker
          </Link>
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-navy-950 transition-colors hidden sm:block">
            Pricing
          </Link>
          <Link href="/scan" className="btn-primary text-sm py-2 px-4">
            Free Scan
          </Link>
        </div>
      </div>
    </nav>
  );
}
