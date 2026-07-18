import Navbar from '@/components/Navbar';

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="font-display font-bold text-4xl text-navy-950 mb-2">Terms of Use</h1>
          <p className="text-gray-400 text-sm mb-10">Last updated: July 2026</p>

          <div className="card p-8 space-y-6 text-gray-700 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-navy-950 mb-2">1. What ScanVault does</h2>
              <p>ScanVault provides automated website security scanning, compliance checklists, and cybersecurity advisory services for businesses in Ghana and Africa. Our scanner performs passive, non-intrusive checks using publicly available information.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-navy-950 mb-2">2. Authorized use only</h2>
              <p>By submitting a domain for scanning, you confirm that you own the domain or have explicit written authorization from the domain owner to perform security testing. Scanning domains you don't own or aren't authorized to test is a violation of these terms and may violate Ghanaian law.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-navy-950 mb-2">3. Not a guarantee</h2>
              <p>Our scanner identifies common, publicly visible security issues. It does not guarantee that a website is fully secure or free of all vulnerabilities. Security is an ongoing process, not a one-time check. We recommend combining automated scanning with regular manual security reviews.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-navy-950 mb-2">4. Limitation of liability</h2>
              <p>ScanVault is not liable for any security incidents, data breaches, or regulatory penalties that occur while using or after using our service. Our reports are advisory in nature — you remain responsible for the security of your own systems.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-navy-950 mb-2">5. Fair use</h2>
              <p>Free scans are limited to 5 per IP address per minute. Automated or bulk scanning without a paid plan is not permitted. We reserve the right to block IPs that abuse the service.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-navy-950 mb-2">6. Changes</h2>
              <p>We may update these terms. Continued use after changes means you accept the updated terms.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-navy-950 mb-2">7. Contact</h2>
              <p>Questions? Email hello@scanvault.app or visit our <a href="/contact" className="text-navy-700 underline">contact page</a>.</p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
