'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Smartphone,
  CreditCard,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  ShieldCheck,
} from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useApplication } from '@/hooks/use-data';
import { supabase } from '@/lib/supabase';
import { getPaymentProvider, simulatePaymentConfirmation } from '@/services/payments';
import { formatCurrency, generatePaymentReference, cn } from '@/lib/utils';
import type { PaymentMethod, PaymentStatus } from '@/types/database';

const methods: { id: PaymentMethod; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'mpesa', label: 'M-Pesa', description: 'Pay via STK push to your phone', icon: Smartphone },
  { id: 'airtel', label: 'Airtel Money', description: 'Pay via Airtel Money prompt', icon: Smartphone },
  { id: 'card', label: 'Card Payment', description: 'Visa / Mastercard', icon: CreditCard },
];

export default function PaymentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: application, isLoading } = useApplication(params.id);
  const [method, setMethod] = useState<PaymentMethod>('mpesa');
  const [account, setAccount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState<'select' | 'pending' | 'success' | 'failed'>('select');
  const [paymentRef, setPaymentRef] = useState('');
  const [providerRef, setProviderRef] = useState('');

  const handlePay = async () => {
    if (!application) return;
    if (!account || account.length < 10) {
      toast.error('Please enter a valid account/phone number.');
      return;
    }

    setProcessing(true);
    setStage('select');

    try {
      const reference = generatePaymentReference();
      const provider = getPaymentProvider(method);

      const result = await provider.initPayment({
        amount: application.processing_fee,
        method,
        account,
        reference,
        description: `Processing fee for ${application.reference_number}`,
      });

      setPaymentRef(reference);
      setProviderRef(result.providerReference);

      const { error: insertError } = await supabase.from('payments').insert({
        application_id: application.id,
        amount: application.processing_fee,
        payment_method: method,
        reference_number: reference,
        provider_reference: result.providerReference,
        status: 'pending',
      });
      if (insertError) throw insertError;

      toast.info(result.message);
      setStage('pending');

      const confirmation = await simulatePaymentConfirmation(result.providerReference);

      const newStatus: PaymentStatus = confirmation.status;
      const { error: updateError } = await supabase
        .from('payments')
        .update({ status: newStatus, paid_at: newStatus === 'paid' ? new Date().toISOString() : null })
        .eq('reference_number', reference);
      if (updateError) throw updateError;

      if (newStatus === 'paid') {
        await supabase
          .from('loan_applications')
          .update({ fee_status: 'paid', status: 'documents_under_review' })
          .eq('id', application.id);

        await supabase.from('notifications').insert({
          title: 'Payment Received',
          message: `Your processing fee of ${formatCurrency(application.processing_fee)} has been received. Your application is now under review.`,
        });

        setStage('success');
        toast.success('Payment successful!');
      } else {
        setStage('failed');
        toast.error('Payment failed. Please try again.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      toast.error(msg);
      setStage('failed');
    } finally {
      setProcessing(false);
    }
  };

  const copyRef = () => {
    navigator.clipboard.writeText(paymentRef);
    toast.success('Reference number copied.');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Payment" />
        <Skeleton className="mx-auto h-96 w-full max-w-md" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Payment" />
        <Card className="mx-auto max-w-md text-center">
          <CardContent className="py-12">
            <p className="text-sm text-muted-foreground">Application not found.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/loans">Back to My Loans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Payment" subtitle="Pay the processing fee to continue your application." />

      <div className="mx-auto max-w-md space-y-5">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href={`/dashboard/loans/${application.id}/fee`}>
            <ArrowLeft className="h-4 w-4" /> Back to Fee Details
          </Link>
        </Button>

        {/* Amount card */}
        <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground shadow-card">
          <CardContent className="p-6 text-center">
            <p className="text-sm opacity-80">Amount Due</p>
            <p className="mt-1 text-4xl font-bold">{formatCurrency(application.processing_fee)}</p>
            <p className="mt-1 text-xs opacity-60">Processing fee · {application.reference_number}</p>
          </CardContent>
        </Card>

        {stage === 'select' && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors',
                      method === m.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    )}
                  >
                    <span className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      method === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      <m.icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                    </div>
                    <div className={cn(
                      'h-5 w-5 rounded-full border-2',
                      method === m.id ? 'border-primary bg-primary' : 'border-border'
                    )} />
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="account">
                  {method === 'card' ? 'Card Number' : 'Phone Number'}
                </Label>
                <Input
                  id="account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder={method === 'card' ? '4242 4242 4242 4242' : '+254 700 000 000'}
                />
              </div>

              <Button onClick={handlePay} disabled={processing} className="w-full gap-2" size="lg">
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Pay {formatCurrency(application.processing_fee)}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                <ShieldCheck className="mr-1 inline h-3 w-3" />
                Secured by 256-bit encryption · Mock payment for demo
              </p>
            </CardContent>
          </Card>
        )}

        {stage === 'pending' && (
          <Card className="shadow-soft">
            <CardContent className="flex flex-col items-center py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
                <Clock className="h-8 w-8 text-warning animate-pulse" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">Awaiting Confirmation</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Please confirm the payment prompt on your {method === 'card' ? 'bank app' : 'phone'}.
                Do not close this page.
              </p>
              <div className="mt-5 w-full space-y-2 rounded-lg bg-muted/50 p-4 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <button onClick={copyRef} className="flex items-center gap-1 font-medium hover:text-primary">
                    {paymentRef} <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                </div>
              </div>
              <Loader2 className="mt-5 h-5 w-5 animate-spin text-primary" />
            </CardContent>
          </Card>
        )}

        {stage === 'success' && (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">Payment Successful</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Your processing fee has been received. Your application is now under review.
              </p>
              <div className="mt-5 w-full space-y-2 rounded-lg bg-muted/50 p-4 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium">{paymentRef}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{formatCurrency(application.processing_fee)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge>
                </div>
              </div>
              <Button asChild className="mt-5 w-full">
                <Link href={`/dashboard/loans/${application.id}`}>View Application Status</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {stage === 'failed' && (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">Payment Failed</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                The payment could not be completed. Please try again or use a different method.
              </p>
              <Button onClick={() => setStage('select')} className="mt-5 w-full">
                Try Again
              </Button>
              <Button asChild variant="ghost" className="mt-2 w-full">
                <Link href={`/dashboard/loans/${application.id}/fee`}>Back to Fee Details</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
