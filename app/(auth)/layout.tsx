import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { ShieldCheck, Zap, Lock, CheckCircle2 } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-secondary p-12 text-secondary-foreground lg:flex">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <Link href="/" className="relative z-10">
          <Logo className="[&_*]:!text-secondary-foreground" />
        </Link>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Borrow with confidence
          </h1>
          <p className="mt-4 text-secondary-foreground/70">
            Join 48,000+ Kenyans who trust PesaCred for fast, transparent, and secure
            online loans. Apply in minutes, get a decision fast.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { icon: Zap, text: '24-hour approval decisions' },
              { icon: ShieldCheck, text: 'Bank-grade security & encryption' },
              { icon: CheckCircle2, text: 'No hidden fees — ever' },
              { icon: Lock, text: 'Your data stays private' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="h-4 w-4 text-primary" />
                </span>
                <span className="text-sm text-secondary-foreground/90">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-secondary-foreground/50">
          © {new Date().getFullYear()} PesaCred. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-4 lg:hidden">
          <Link href="/">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <div className="hidden items-center justify-end p-4 lg:flex">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 lg:px-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
