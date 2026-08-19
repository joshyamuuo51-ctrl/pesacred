import { PublicNavbar } from '@/components/public-navbar';
import { PublicFooter } from '@/components/public-footer';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16 lg:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight">Terms of Service</h1>
          </div>
          <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="mt-2">By accessing and using PesaCred&apos;s online lending platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using the platform.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">2. Loan Applications</h2>
              <p className="mt-2">Submitting a loan application through PesaCred does not constitute a guarantee of approval. All loans are subject to eligibility assessment, credit checks, and verification of provided information. PesaCred reserves the right to approve or decline any application at its discretion.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">3. Processing Fees</h2>
              <p className="mt-2">Certain loan products may require a processing or application fee. Where applicable, the fee amount, purpose, and refundability will be clearly disclosed before you proceed with payment. <strong className="text-foreground">Payment of any processing fee does not guarantee loan approval.</strong> Approval depends on the successful completion of the eligibility and credit assessment process.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">4. Borrower Obligations</h2>
              <p className="mt-2">Upon loan approval and disbursement, you are obligated to repay the loan according to the agreed schedule. Late payments may incur additional charges and affect your credit standing. You must provide accurate and truthful information at all times.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">5. Data Protection</h2>
              <p className="mt-2">Your personal data is collected, stored, and processed in accordance with applicable data protection laws. For details, please refer to our Privacy Policy.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">6. Limitation of Liability</h2>
              <p className="mt-2">PesaCred shall not be liable for any indirect, incidental, or consequential damages arising from the use of the platform or the inability to obtain a loan.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">7. Contact</h2>
              <p className="mt-2">For questions about these Terms, contact us at support@pesacred.co.ke or +254 700 000 000.</p>
            </section>
            <p className="border-t border-border pt-6 text-xs">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
