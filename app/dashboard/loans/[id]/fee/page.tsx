'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
} from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useApplication, useCancelApplication } from '@/hooks/use-data';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function FeeDisclosurePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: application, isLoading } = useApplication(params.id);

  const cancelMutation = useCancelApplication();
  const [cancelling, setCancelling] = useState(false);

  const product = application?.loan_products;

  const handleCancel = async () => {
    setCancelling(true);
    cancelMutation.mutate(params.id, {
      onSuccess: () => {
        toast.success('Application cancelled.');
        router.push('/dashboard/loans');
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to cancel application.');
        setCancelling(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Processing Fee" subtitle="Review the fee details before proceeding." />
        <Skeleton className="h-96 w-full max-w-2xl mx-auto" />
      </div>
    );
  }

  if (!application || !product) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Processing Fee" />
        <Card className="mx-auto max-w-md text-center">
          <CardContent className="py-12">
            <XCircle className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Application not found.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/loans">Back to My Loans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (application.fee_status === 'paid') {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Processing Fee" />
        <Card className="mx-auto max-w-md text-center">
          <CardContent className="py-12">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 font-display text-lg font-semibold">Fee Already Paid</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The processing fee for this application has been paid.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/dashboard/loans/${application.id}`}>View Application</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Processing Fee"
        subtitle="Review the fee details before proceeding with payment."
      />

      <div className="mx-auto max-w-2xl space-y-5">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href="/dashboard/loans">
            <ArrowLeft className="h-4 w-4" /> Back to My Loans
          </Link>
        </Button>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Application Summary</CardTitle>
              <Badge variant="outline" className="text-muted-foreground">
                {application.reference_number}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Loan Product</p>
                <p className="font-medium">{product.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Requested Amount</p>
                <p className="font-medium">{formatCurrency(application.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Loan Term</p>
                <p className="font-medium">{application.requested_term_months} months</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimated Interest</p>
                <p className="font-medium">{formatCurrency(application.interest_amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee disclosure */}
        <Card className="border-warning/30 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-warning" />
              <CardTitle className="text-lg">Processing Fee Disclosure</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-warning/10 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing Fee Amount</p>
                <p className="text-3xl font-bold text-foreground">{formatCurrency(application.processing_fee)}</p>
              </div>
              <Badge className={product.fee_refundable ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}>
                {product.fee_refundable ? 'Refundable' : 'Non-Refundable'}
              </Badge>
            </div>

            {product.fee_description && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Why is this fee charged?</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{product.fee_description}</p>
              </div>
            )}

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 shrink-0 text-secondary" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-foreground">Processing Timeline</p>
                  <p className="text-muted-foreground">
                    Once the fee is paid, your application enters the document review and
                    eligibility assessment phase. The estimated processing time is{' '}
                    <span className="font-medium text-foreground">24–48 hours</span> after
                    fee payment and document verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Legal disclaimer */}
            <div className="rounded-lg border-2 border-warning/30 bg-warning/5 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
                <p className="text-sm leading-relaxed text-foreground">
                  <span className="font-semibold">Important:</span> Payment of this
                  processing fee <span className="font-semibold underline">does not guarantee
                  loan approval</span>. Approval depends on completion of the eligibility and
                  credit assessment process. The fee covers the cost of processing your
                  application and is{' '}
                  {product.fee_refundable ? 'refundable if your application is declined' : 'non-refundable regardless of the outcome'}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={cancelling}
            className="gap-2 text-destructive hover:text-destructive"
          >
            {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Cancel Application
          </Button>
          <Button asChild size="lg" className="gap-2">
            <Link href={`/dashboard/loans/${application.id}/pay`}>
              Pay Now — {formatCurrency(application.processing_fee)}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
