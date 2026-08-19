'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/register');
    }
    if (!loading && user) {
      const t = setTimeout(() => router.replace('/dashboard'), 4000);
      return () => clearTimeout(t);
    }
  }, [user, loading, router]);

  const handleResend = async () => {
    if (!user?.email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: user.email });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Verification email sent.');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Mail className="h-8 w-8 text-primary" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">Verify your email</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a verification link to{' '}
        <span className="font-medium text-foreground">{user?.email}</span>. Click the link
        to activate your account.
      </p>

      <Card className="mt-6 border-primary/20 bg-primary/5 text-left">
        <CardContent className="flex gap-3 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
          <div className="text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">You can start using your account now.</p>
            <p className="mt-1">
              We&apos;ll redirect you to your dashboard in a moment, or continue below.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-3">
        <Button asChild className="w-full gap-2">
          <Link href="/dashboard">
            Continue to Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resend verification email'}
        </Button>
      </div>
    </div>
  );
}
