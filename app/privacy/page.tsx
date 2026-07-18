import { Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="font-display font-bold text-4xl text-navy-950 mb-2">Privacy Policy</h1>
          <p className="text-gray-400 text-sm mb-10">Last updated: July 2026</p>

          <div className="card p-8 space-y-6 text-gray-700 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-navy-950 mb-2">1. What we collect</h2>
              <p>When you run a security scan, we collect the domain name you submit and optionally your email address (if you choose to unlock your full report). We also log the scan results to provide your report and improve our scanning accuracy. We do not collect payment information on this platform.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-navy-950 mb-2">2. How we use your information</h2>
              <p>Your domain and email are used solely to provide your security report, send you the report if you request it, and follow up with relevant cybersecurity information relevant to your scan results. We do not sell your data to third parties.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-navy-950 mb-2">3. Data storage and security</h2>
              <p>Your data is stored on secured, access-controlled servers. Scan results are stored in an encrypted database. We apply industry-standard security practices — consistent with what we recommend to our clients.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-navy-950 mb-2">4. Your rights under Ghana's Data Protection Act 843</h2>
              <p>You have the right to access, correct, or request deletion of any personal data we hold about you. To exercise these rights, email us at hello@scanvault.app with the subject line "Data Request." We will respond within 21 business days.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-navy-950 mb-2">5. Scanning third-party websites</h2>
              <p>Our scanner performs passive, non-intrusive checks on websites you submit — the same checks any browser or security researcher would perform. We do not exploit vulnerabilities or access protected content. You are responsible for ensuring you have authorization to scan any domain you submit.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-navy-950 mb-2">6. Contact</h2>
              <p>Privacy questions? Email hello@scanvault.app or visit our <a href="/contact" className="text-navy-700 underline">contact page</a>.</p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
