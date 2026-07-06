'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-navy-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/logo.svg" alt="CyberGH" width={160} height={40} priority />
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/compliance" className="text-sm text-gray-600 hover:text-navy-950 transition-colors hidden sm:block">
            Compliance Checker
          </Link>
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-navy-950 transition-colors hidden sm:block">
            Pricing
          </Link>
          <Link href="/" className="btn-primary text-sm py-2 px-4">
            Free Scan
          </Link>
        </div>
      </div>
    </nav>
  );
}
