import { PublicNavbar } from '@/components/public-navbar';
import { PublicFooter } from '@/components/public-footer';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16 lg:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight">Privacy Policy</h1>
          </div>
          <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">1. Information We Collect</h2>
              <p className="mt-2">When you register and apply for a loan, we collect: your full name, national ID number, date of birth, phone number, email address, employment details, financial information, and uploaded documents (ID, payslips, selfie, bank statements).</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
              <p className="mt-2">We use your information to: verify your identity, assess loan eligibility, process loan applications, communicate with you about your applications, and comply with regulatory requirements.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">3. Data Security</h2>
              <p className="mt-2">We employ bank-grade encryption (256-bit SSL) and row-level security to protect your data. Access to your personal information is restricted to authorized personnel only. All administrative actions are logged in an immutable audit trail.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">4. Data Sharing</h2>
              <p className="mt-2">We do not sell your personal information. We may share data with credit reference bureaus and regulatory authorities as required by law. Payment processing is handled through authorized providers (M-Pesa, Airtel Money, card processors).</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">5. Your Rights</h2>
              <p className="mt-2">You have the right to: access your personal data, correct inaccurate information, request deletion of your data (subject to legal retention requirements), and withdraw consent for marketing communications.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">6. Data Retention</h2>
              <p className="mt-2">We retain your personal data for the duration of your relationship with PesaCred and thereafter as required by applicable laws and regulations.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">7. Contact</h2>
              <p className="mt-2">For privacy-related questions or requests, contact us at support@pesacred.co.ke.</p>
            </section>
            <p className="border-t border-border pt-6 text-xs">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
