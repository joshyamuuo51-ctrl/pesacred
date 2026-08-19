import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Mail, Phone, MapPin, Shield, Clock } from 'lucide-react';

const sections = [
  {
    title: 'Products',
    links: [
      { label: 'Personal Loans', href: '/#loan-products' },
      { label: 'Business Loans', href: '/#loan-products' },
      { label: 'Emergency Loans', href: '/#loan-products' },
      { label: 'Salary Advance', href: '/#loan-products' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'Why PesaCred', href: '/#why-us' },
      { label: 'Reviews', href: '/#reviews' },
      { label: 'Contact', href: '/#contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-14 lg:px-6">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo className="[&_*]:!text-secondary-foreground" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-secondary-foreground/70">
              PesaCred is a modern online lending platform offering fast, secure, and
              transparent loans. Clear terms, no hidden fees, and a simple digital
              application process.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 text-sm text-secondary-foreground/80">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> support@pesacred.co.ke
              </span>
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> +254 700 000 000
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Westlands, Nairobi, Kenya
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Mon-Fri 8am-6pm EAT
              </span>
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-secondary-foreground">{section.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-secondary-foreground/70 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-secondary-foreground/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-secondary-foreground/60">
            © {new Date().getFullYear()} PesaCred. All rights reserved. PesaCred is a
            regulated digital lending platform.
          </p>
          <div className="flex items-center gap-2 text-xs text-secondary-foreground/60">
            <Shield className="h-4 w-4 text-primary" />
            <span>Bank-grade encryption · Data protected</span>
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-secondary-foreground/50">
          Disclaimer: PesaCred is a digital lending platform. All loans are subject to
          eligibility assessment and credit checks. Where a processing or application fee
          applies, it will be disclosed before you proceed. Payment of any fee does not
          guarantee loan approval. Approval depends on completion of the eligibility and
          credit assessment process.
        </p>
      </div>
    </footer>
  );
}
