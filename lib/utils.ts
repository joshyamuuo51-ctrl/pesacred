import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { LoanStatus, PaymentStatus, DocumentType, FeeStatus, TicketStatus } from '@/types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency = 'KES'): string {
  if (amount === null || amount === undefined) return '—';
  const formatted = new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${currency} ${formatted}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function loanStatusLabel(status: LoanStatus): string {
  const labels: Record<LoanStatus, string> = {
    application_received: 'Application Received',
    documents_under_review: 'Documents Under Review',
    eligibility_assessment: 'Eligibility Assessment',
    fee_pending: 'Fee Pending',
    fee_paid: 'Fee Paid',
    approved: 'Approved',
    declined: 'Declined',
    disbursed: 'Disbursed',
  };
  return labels[status] ?? status;
}

export function loanStatusColor(status: LoanStatus): string {
  const colors: Record<LoanStatus, string> = {
    application_received: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    documents_under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    eligibility_assessment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    fee_pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    fee_paid: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    declined: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    disbursed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  };
  return colors[status] ?? 'bg-muted text-muted-foreground';
}

export function loanStatusStep(status: LoanStatus): number {
  const order: LoanStatus[] = [
    'application_received',
    'documents_under_review',
    'eligibility_assessment',
    'fee_pending',
    'fee_paid',
    'approved',
    'disbursed',
  ];
  if (status === 'declined') return -1;
  return order.indexOf(status);
}

export function paymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
  };
  return labels[status] ?? status;
}

export function paymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    refunded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  };
  return colors[status] ?? 'bg-muted text-muted-foreground';
}

export function feeStatusLabel(status: FeeStatus): string {
  const labels: Record<FeeStatus, string> = {
    not_required: 'Not Required',
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
  };
  return labels[status] ?? status;
}

export function ticketStatusLabel(status: TicketStatus): string {
  const labels: Record<TicketStatus, string> = {
    open: 'Open',
    responded: 'Responded',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return labels[status] ?? status;
}

export function documentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    national_id: 'National ID',
    payslip: 'Payslip / Proof of Income',
    selfie: 'Selfie',
    bank_statement: 'Bank Statement',
  };
  return labels[type] ?? type;
}

export function generateReferenceNumber(): string {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PC-${ymd}-${rand}`;
}

export function generatePaymentReference(): string {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `PYMT-${rand}`;
}
