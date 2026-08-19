'use client';

import { useState, useMemo } from 'react';
import { CreditCard, Search, Filter, Download } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-sidebar';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useMyPayments } from '@/hooks/use-data';
import type { PaymentWithApplication } from '@/types/database';
import { formatCurrency, formatDateTime, paymentStatusLabel, paymentStatusColor, cn } from '@/lib/utils';
import type { PaymentStatus } from '@/types/database';

const statusFilters: { value: string; label: string }[] = [
  { value: 'all', label: 'All Payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

export default function PaymentsPage() {
  const { data, isLoading } = useMyPayments();
  const payments: PaymentWithApplication[] = data ?? [];
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (!payments) return [];
    return payments.filter((p) => {
      const matchesSearch =
        p.reference_number.toLowerCase().includes(search.toLowerCase()) ||
        p.loan_applications?.reference_number.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || p.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [payments, search, filter]);

  const totalPaid = payments?.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <DashboardHeader title="Payments" subtitle="View your payment history and processing fee payments." />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-soft">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Pending Payments</p>
            <p className="mt-1 text-2xl font-bold">{payments?.filter((p) => p.status === 'pending').length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Total Transactions</p>
            <p className="mt-1 text-2xl font-bold">{payments?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by reference number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="shadow-soft">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <CreditCard className="h-7 w-7 text-primary" />
              </span>
              <p className="mt-4 text-sm text-muted-foreground">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Application</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.reference_number}</TableCell>
                      <TableCell className="text-muted-foreground">{p.loan_applications?.reference_number ?? '—'}</TableCell>
                      <TableCell className="uppercase">{p.payment_method}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                      <TableCell>
                        <Badge className={paymentStatusColor(p.status as PaymentStatus)}>
                          {paymentStatusLabel(p.status as PaymentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(p.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
