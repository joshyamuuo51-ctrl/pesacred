'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  Calendar,
  CreditCard,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyApplications, useMyPayments, useMyNotifications } from '@/hooks/use-data';
import type { ApplicationWithProduct, PaymentWithApplication, Notification } from '@/types/database';
import { formatCurrency, formatDate, loanStatusLabel, loanStatusColor, formatRelativeTime, cn } from '@/lib/utils';
import { LoanStatusTracker } from '@/components/loan-status-tracker';

export default function DashboardPage() {
  const { data: appsData, isLoading: appsLoading } = useMyApplications();
  const applications: ApplicationWithProduct[] = appsData ?? [];
  const { data: payData, isLoading: payLoading } = useMyPayments();
  const payments: PaymentWithApplication[] = payData ?? [];
  const { data: notifData, isLoading: notifLoading } = useMyNotifications();
  const notifications: Notification[] = notifData ?? [];

  const activeLoan = useMemo(
    () => applications?.find((a) => a.status === 'disbursed'),
    [applications]
  );
  const pendingApplications = useMemo(
    () =>
      applications?.filter((a) =>
        ['application_received', 'documents_under_review', 'eligibility_assessment', 'fee_pending', 'fee_paid', 'approved'].includes(a.status)
      ) ?? [],
    [applications]
  );
  const availableLimit = useMemo(() => {
    const totalActive = (applications ?? [])
      .filter((a) => a.status === 'disbursed')
      .reduce((sum, a) => sum + a.amount, 0);
    return Math.max(0, 250000 - totalActive);
  }, [applications]);

  const recentActivity = useMemo(() => {
    const items = [
      ...(applications ?? []).map((a) => ({
        id: a.id,
        type: 'application' as const,
        title: `Loan application ${a.reference_number}`,
        subtitle: loanStatusLabel(a.status),
        time: a.updated_at,
      })),
      ...(payments ?? []).map((p) => ({
        id: p.id,
        type: 'payment' as const,
        title: `Payment ${p.reference_number}`,
        subtitle: p.status === 'paid' ? 'Payment successful' : `Payment ${p.status}`,
        time: p.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
    return items;
  }, [applications, payments]);

  const unreadNotifications = notifications?.filter((n) => !n.read).slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Dashboard"
        subtitle="Welcome back. Here is an overview of your loan activity."
        action={
          <Button asChild className="gap-2">
            <Link href="/dashboard/apply">
              <FileText className="h-4 w-4" /> Apply for a Loan
            </Link>
          </Button>
        }
      />

      {/* Widgets */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Widget
          title="Active Loan"
          value={activeLoan ? formatCurrency(activeLoan.amount) : 'None'}
          subtitle={activeLoan ? activeLoan.loan_products?.name ?? 'Personal Loan' : 'No active loans'}
          icon={Wallet}
          color="primary"
          loading={appsLoading}
        />
        <Widget
          title="Pending Applications"
          value={String(pendingApplications.length)}
          subtitle={pendingApplications.length > 0 ? 'In progress' : 'No pending applications'}
          icon={Clock}
          color="warning"
          loading={appsLoading}
        />
        <Widget
          title="Available Limit"
          value={formatCurrency(availableLimit)}
          subtitle="Based on your profile"
          icon={TrendingUp}
          color="secondary"
          loading={appsLoading}
        />
        <Widget
          title="Total Paid"
          value={formatCurrency(payments?.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0) ?? 0)}
          subtitle="Processing fees paid"
          icon={CreditCard}
          color="success"
          loading={payLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active loan / status tracker */}
        <div className="lg:col-span-2 space-y-6">
          {activeLoan ? (
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Active Loan Status</CardTitle>
                  <p className="text-sm text-muted-foreground">{activeLoan.reference_number}</p>
                </div>
                <Badge className={loanStatusColor(activeLoan.status)}>
                  {loanStatusLabel(activeLoan.status)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Loan Amount</p>
                    <p className="mt-1 font-semibold">{formatCurrency(activeLoan.amount)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Total Repayable</p>
                    <p className="mt-1 font-semibold">{formatCurrency(activeLoan.total_repayable)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Term</p>
                    <p className="mt-1 font-semibold">{activeLoan.requested_term_months} months</p>
                  </div>
                </div>
                <LoanStatusTracker status={activeLoan.status} />
              </CardContent>
            </Card>
          ) : pendingApplications[0] ? (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-base">Application In Progress</CardTitle>
                <p className="text-sm text-muted-foreground">{pendingApplications[0].reference_number}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">Current Status</span>
                  <Badge className={loanStatusColor(pendingApplications[0].status)}>
                    {loanStatusLabel(pendingApplications[0].status)}
                  </Badge>
                </div>
                <LoanStatusTracker status={pendingApplications[0].status} />
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/dashboard/loans/${pendingApplications[0].id}`}>
                    View Details <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-soft">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Wallet className="h-7 w-7 text-primary" />
                </span>
                <h3 className="mt-4 font-semibold">No active loans yet</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Apply for your first loan and get a decision in as little as 24 hours.
                </p>
                <Button asChild className="mt-4 gap-2">
                  <Link href="/dashboard/apply">
                    Apply Now <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recent activity */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {appsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))
              ) : recentActivity.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((item) => (
                  <div key={item.id + item.type} className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50">
                    <span className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      item.type === 'application' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                    )}>
                      {item.type === 'application' ? <FileText className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(item.time)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Next payment + notifications */}
        <div className="space-y-6">
          {activeLoan && (
            <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm opacity-80">
                  <Calendar className="h-4 w-4 text-primary" /> Next Payment
                </div>
                <p className="mt-3 text-3xl font-bold">
                  {formatCurrency(activeLoan.total_repayable / activeLoan.requested_term_months)}
                </p>
                <p className="mt-1 text-sm opacity-70">
                  Due {formatDate(new Date(Date.now() + 12 * 24 * 60 * 60 * 1000))}
                </p>
                <Button asChild variant="secondary" className="mt-4 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/dashboard/payments">
                    Make Payment <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Notifications</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/notifications">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {notifLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : unreadNotifications.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <Bell className="h-7 w-7 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">You&apos;re all caught up</p>
                </div>
              ) : (
                unreadNotifications.map((n) => (
                  <div key={n.id} className="flex gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bell className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Widget({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: 'primary' | 'secondary' | 'warning' | 'success';
  loading?: boolean;
}) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    warning: 'bg-warning/15 text-warning',
    success: 'bg-success/10 text-success',
  };
  return (
    <Card className="shadow-soft">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-24" />
            ) : (
              <p className="mt-1.5 truncate text-2xl font-bold">{value}</p>
            )}
            <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', colorMap[color])}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
