import { Shield, Twitter, Linkedin, Github, Globe, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy-950 pt-16 pb-8 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute w-[400px] h-[400px] bg-teal-500/10 blur-[100px] rounded-full -top-32 -right-32 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Top CTA Block (SquareUi Style) */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-10 mb-16 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-teal-gradient opacity-50"></div>
          <div>
            <h3 className="font-display font-bold text-2xl text-white mb-2">Ready to secure your business?</h3>
            <p className="text-gray-400 max-w-md">Join hundreds of African businesses trusting ScanVault to protect their digital infrastructure.</p>
          </div>
          <div className="flex gap-4 flex-shrink-0">
            <Link href="/signup" className="btn-primary group-hover:shadow-teal-glow transition-all duration-300">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-teal-gradient rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white tracking-tight">ScanVault</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm">
              The premier Pan-African cybersecurity platform. We help businesses monitor vulnerabilities, detect data breaches, and achieve regional compliance effortlessly.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-teal-500/20 hover:text-teal-400 hover:border-teal-500/50 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-teal-500/20 hover:text-teal-400 hover:border-teal-500/50 transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://github.com" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-teal-500/20 hover:text-teal-400 hover:border-teal-500/50 transition-all">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Column 1 */}
            <div>
              <h4 className="text-white font-semibold mb-6">Product</h4>
              <ul className="space-y-4">
                <li><Link href="/features" className="text-gray-400 hover:text-teal-400 text-sm transition-colors">Vulnerability Scanner</Link></li>
                <li><Link href="/compliance" className="text-gray-400 hover:text-teal-400 text-sm transition-colors">Compliance Checker</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-teal-400 text-sm transition-colors">Pricing</Link></li>
                <li><Link href="/pentest" className="text-gray-400 hover:text-teal-400 text-sm transition-colors">Enterprise Pentest</Link></li>
              </ul>
            </div>
            
            {/* Column 2 */}
            <div>
              <h4 className="text-white font-semibold mb-6">Resources</h4>
              <ul className="space-y-4">
                <li><Link href="/docs" className="text-gray-400 hover:text-teal-400 text-sm transition-colors">Documentation</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-teal-400 text-sm transition-colors">Security Blog</Link></li>
                <li><Link href="/guides" className="text-gray-400 hover:text-teal-400 text-sm transition-colors">Compliance Guides</Link></li>
                <li><Link href="/help" className="text-gray-400 hover:text-teal-400 text-sm transition-colors">Help Center</Link></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="text-white font-semibold mb-6">Company</h4>
              <ul className="space-y-4">
                <li><Link href="/about" className="text-gray-400 hover:text-teal-400 text-sm transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="text-gray-400 hover:text-teal-400 text-sm transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-teal-400 text-sm transition-colors">Contact</Link></li>
                <li><Link href="/partners" className="text-gray-400 hover:text-teal-400 text-sm transition-colors">Partners</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-500 text-sm flex items-center gap-2">
            © {new Date().getFullYear()} ScanVault Security. All rights reserved. 
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Globe className="w-4 h-4" />
              <span>Accra, Ghana (HQ)</span>
            </div>
            <div className="flex gap-4 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-500 hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
