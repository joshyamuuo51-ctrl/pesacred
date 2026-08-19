'use client';

import Link from 'next/link';
import {
  Users,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  ArrowRight,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AdminHeader } from '@/components/admin-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminStats, type AdminStats } from '@/hooks/use-admin';
import { formatCurrency, formatDate, loanStatusLabel, loanStatusColor, cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminStats();
  const stats: AdminStats | undefined = data;

  const chartData = [
    { name: 'Mon', applications: 12, disbursed: 8 },
    { name: 'Tue', applications: 19, disbursed: 11 },
    { name: 'Wed', applications: 15, disbursed: 9 },
    { name: 'Thu', applications: 22, disbursed: 14 },
    { name: 'Fri', applications: 28, disbursed: 18 },
    { name: 'Sat', applications: 18, disbursed: 12 },
    { name: 'Sun', applications: 10, disbursed: 6 },
  ];

  return (
    <div className="space-y-6">
      <AdminHeader title="Admin Dashboard" subtitle="Overview of platform activity and key metrics." />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} loading={isLoading} />
        <StatCard title="Applications" value={stats?.totalApplications ?? 0} icon={FileText} loading={isLoading} />
        <StatCard title="Pending Reviews" value={stats?.pendingReviews ?? 0} icon={Clock} color="warning" loading={isLoading} />
        <StatCard title="Approved" value={stats?.approvedLoans ?? 0} icon={CheckCircle2} color="success" loading={isLoading} />
        <StatCard title="Declined" value={stats?.declinedLoans ?? 0} icon={XCircle} color="destructive" loading={isLoading} />
        <StatCard title="Payments" value={formatCurrency(stats?.paymentsReceived ?? 0)} icon={CreditCard} color="primary" loading={isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Weekly Activity</CardTitle>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Applications
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-secondary" /> Disbursed
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDisb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="applications" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorApp)" />
                  <Area type="monotone" dataKey="disbursed" stroke="hsl(var(--secondary))" strokeWidth={2} fill="url(#colorDisb)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm opacity-80">
                <TrendingUp className="h-4 w-4 text-primary" /> Total Disbursed
              </div>
              <p className="mt-2 text-3xl font-bold">{formatCurrency(stats?.totalDisbursed ?? 0)}</p>
              <p className="mt-1 text-xs opacity-60">Across all approved loans</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm opacity-80">
                <Wallet className="h-4 w-4" /> Payments Received
              </div>
              <p className="mt-2 text-3xl font-bold">{formatCurrency(stats?.paymentsReceived ?? 0)}</p>
              <p className="mt-1 text-xs opacity-70">Processing fees collected</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent applications */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent Applications</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/applicants">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : stats?.recentApplications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No applications yet</p>
          ) : (
            stats?.recentApplications.map((app) => (
              <Link key={app.id} href={`/admin/applicants/${app.id}`}>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{app.loan_products?.name ?? 'Loan'}</p>
                    <p className="truncate text-xs text-muted-foreground">{app.reference_number} · {formatDate(app.applied_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(app.amount)}</p>
                  </div>
                  <Badge className={loanStatusColor(app.status)}>
                    {loanStatusLabel(app.status)}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color = 'default',
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: 'default' | 'primary' | 'warning' | 'success' | 'destructive';
  loading?: boolean;
}) {
  const colorMap = {
    default: 'bg-primary/10 text-primary',
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-warning/15 text-warning',
    success: 'bg-success/10 text-success',
    destructive: 'bg-destructive/10 text-destructive',
  };
  return (
    <Card className="shadow-soft">
      <CardContent className="p-4">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', colorMap[color])}>
          <Icon className="h-4.5 w-4.5" />
        </span>
        <p className="mt-3 text-xs font-medium text-muted-foreground">{title}</p>
        {loading ? (
          <Skeleton className="mt-1 h-6 w-20" />
        ) : (
          <p className="mt-0.5 text-xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
