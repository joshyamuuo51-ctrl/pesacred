'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  CreditCard,
  Wallet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LoanStatusTracker } from '@/components/loan-status-tracker';
import { useApplication, useApplicationDocuments } from '@/hooks/use-data';
import type { LoanApplication, LoanProduct, LoanDocument } from '@/types/database';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  loanStatusLabel,
  loanStatusColor,
  feeStatusLabel,
  documentTypeLabel,
} from '@/lib/utils';

export default function LoanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: appData, isLoading } = useApplication(params.id);
  const application = appData;
  const { data: docData } = useApplicationDocuments(params.id);
  const documents: LoanDocument[] = docData ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Loan Details" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!application || !application.loan_products) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Loan Details" />
        <Card className="text-center">
          <CardContent className="py-12">
            <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Application not found.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/loans">Back to My Loans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const product = application.loan_products;
  const feeDue = application.fee_status === 'pending';

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-1.5 -mb-2">
        <Link href="/dashboard/loans">
          <ArrowLeft className="h-4 w-4" /> Back to My Loans
        </Link>
      </Button>

      <DashboardHeader
        title={product.name}
        subtitle={`Reference ${application.reference_number}`}
        action={
          <Badge className={loanStatusColor(application.status)}>
            {loanStatusLabel(application.status)}
          </Badge>
        }
      />

      {feeDue && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-medium">Processing Fee Due</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(application.processing_fee)} — Pay to continue your application
                </p>
              </div>
            </div>
            <Button asChild className="gap-2">
              <Link href={`/dashboard/loans/${application.id}/fee`}>
                <CreditCard className="h-4 w-4" /> Pay Fee
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status tracker */}
        <div className="lg:col-span-1">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <LoanStatusTracker status={application.status} />
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <DetailRow label="Loan Amount" value={formatCurrency(application.amount)} />
              <DetailRow label="Loan Term" value={`${application.requested_term_months} months`} />
              <DetailRow label="Interest Rate" value={`${product.interest_rate}% p.a.`} />
              <DetailRow label="Interest Amount" value={formatCurrency(application.interest_amount)} />
              <DetailRow label="Total Repayable" value={formatCurrency(application.total_repayable)} highlight />
              <DetailRow label="Monthly Payment" value={formatCurrency(application.total_repayable / application.requested_term_months)} />
              <DetailRow label="Processing Fee" value={formatCurrency(application.processing_fee)} />
              <DetailRow label="Fee Status" value={feeStatusLabel(application.fee_status)} />
              {application.approved_amount !== null && (
                <DetailRow label="Approved Amount" value={formatCurrency(application.approved_amount)} highlight />
              )}
              {application.disbursed_amount !== null && (
                <DetailRow label="Disbursed Amount" value={formatCurrency(application.disbursed_amount)} />
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Application Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <DetailRow label="Loan Purpose" value={application.purpose} />
              <DetailRow label="Employment Status" value={application.employment_status.replace('_', ' ')} />
              {application.employer && <DetailRow label="Employer" value={application.employer} />}
              <DetailRow label="Monthly Income" value={formatCurrency(application.monthly_income)} />
              <DetailRow label="Mobile Money" value={application.mobile_money_number} />
              {application.bank_name && <DetailRow label="Bank" value={application.bank_name} />}
              <DetailRow label="County" value={application.county} />
              <DetailRow label="Address" value={application.address} />
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {documents && documents.length > 0 ? (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{documentTypeLabel(doc.document_type)}</p>
                      <p className="truncate text-xs text-muted-foreground">{doc.file_name}</p>
                    </div>
                    {doc.verified && (
                      <Badge className="bg-emerald-100 text-emerald-700">Verified</Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No documents uploaded</p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <TimelineItem label="Application Submitted" date={application.applied_at} />
              {application.reviewed_at && <TimelineItem label="Documents Reviewed" date={application.reviewed_at} />}
              {application.approved_at && <TimelineItem label="Loan Approved" date={application.approved_at} />}
              {application.disbursed_at && <TimelineItem label="Funds Disbursed" date={application.disbursed_at} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={highlight ? 'font-bold text-primary' : 'font-medium'}>{value}</p>
    </div>
  );
}

function TimelineItem({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-primary" /> {label}
      </span>
      <span className="text-xs text-muted-foreground">{formatDateTime(date)}</span>
    </div>
  );
}
