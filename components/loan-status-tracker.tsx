'use client';

import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import type { LoanStatus } from '@/types/database';
import { loanStatusLabel, loanStatusStep, cn } from '@/lib/utils';

const steps: LoanStatus[] = [
  'application_received',
  'documents_under_review',
  'eligibility_assessment',
  'fee_pending',
  'fee_paid',
  'approved',
  'disbursed',
];

export function LoanStatusTracker({ status }: { status: LoanStatus }) {
  const isDeclined = status === 'declined';
  const currentStep = loanStatusStep(status);

  if (isDeclined) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <XCircle className="h-5 w-5 text-destructive" />
        <div>
          <p className="text-sm font-medium text-destructive">Application Declined</p>
          <p className="text-xs text-muted-foreground">
            Your application was not approved at this time. You may reapply after 30 days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;
        const isFuture = index > currentStep;
        const showFeeSteps = step === 'fee_pending' || step === 'fee_paid';
        const feeApplicable = currentStep >= 3 || status === 'fee_pending' || status === 'fee_paid' || status === 'approved' || status === 'disbursed';

        if (showFeeSteps && !feeApplicable) return null;

        return (
          <div key={step} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : isCurrent ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40" />
              )}
              {index < steps.length - 1 && (
                <div className={cn('mt-1 h-8 w-0.5', isComplete ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
            <div className={cn('pt-0.5', isCurrent && 'pb-2')}>
              <p className={cn(
                'text-sm font-medium',
                isFuture ? 'text-muted-foreground/60' : 'text-foreground'
              )}>
                {loanStatusLabel(step)}
              </p>
              {isCurrent && (
                <p className="mt-0.5 text-xs text-muted-foreground">In progress</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
