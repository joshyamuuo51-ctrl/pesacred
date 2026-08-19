'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  FileText,
  ArrowRight,
  Search,
  Filter,
  Wallet,
  Plus,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMyApplications } from '@/hooks/use-data';
import type { ApplicationWithProduct } from '@/types/database';
import { formatCurrency, formatDate, loanStatusLabel, loanStatusColor } from '@/lib/utils';
import type { LoanStatus } from '@/types/database';

const statusFilters: { value: string; label: string }[] = [
  { value: 'all', label: 'All Applications' },
  { value: 'pending', label: 'In Progress' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
  { value: 'disbursed', label: 'Disbursed' },
];

export default function MyLoansPage() {
  const { data, isLoading } = useMyApplications();
  const applications: ApplicationWithProduct[] = data ?? [];
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (!applications) return [];
    return applications.filter((app) => {
      const matchesSearch =
        app.reference_number.toLowerCase().includes(search.toLowerCase()) ||
        app.loan_products?.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === 'all' ||
        (filter === 'pending' && ['application_received', 'documents_under_review', 'eligibility_assessment', 'fee_pending', 'fee_paid', 'approved'].includes(app.status)) ||
        (filter === 'approved' && app.status === 'approved') ||
        (filter === 'declined' && app.status === 'declined') ||
        (filter === 'disbursed' && app.status === 'disbursed');
      return matchesSearch && matchesFilter;
    });
  }, [applications, search, filter]);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="My Loans"
        subtitle="Track all your loan applications and their status."
        action={
          <Button asChild className="gap-2">
            <Link href="/dashboard/apply">
              <Plus className="h-4 w-4" /> New Application
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by reference number or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Wallet className="h-7 w-7 text-primary" />
            </span>
            <h3 className="mt-4 font-semibold">No loan applications found</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {search || filter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Apply for your first loan to get started.'}
            </p>
            <Button asChild className="mt-4 gap-2">
              <Link href="/dashboard/apply">
                Apply Now <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <Link key={app.id} href={`/dashboard/loans/${app.id}`}>
              <Card className="shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{app.loan_products?.name ?? 'Loan'}</p>
                        <Badge className={loanStatusColor(app.status)}>
                          {loanStatusLabel(app.status)}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {app.reference_number} · Applied {formatDate(app.applied_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-semibold">{formatCurrency(app.amount)}</p>
                    </div>
                    {app.fee_status === 'pending' && (
                      <Badge className="bg-orange-100 text-orange-700">Fee Due</Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
