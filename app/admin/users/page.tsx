'use client';

import { useState, useMemo } from 'react';
import {
  UserCog,
  Search,
  Filter,
  Clock,
  LogIn,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useAdminUsers, type AdminUser } from '@/hooks/use-admin';
import { formatDateTime, formatRelativeTime, initials, cn } from '@/lib/utils';
import type { AppRole } from '@/types/database';

const roleFilters: { value: string; label: string }[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'user', label: 'Users' },
  { value: 'admin', label: 'Admins' },
  { value: 'support', label: 'Support Staff' },
];

const roleBadgeClass: Record<AppRole, string> = {
  user: 'bg-primary/10 text-primary',
  admin: 'bg-secondary/10 text-secondary',
  support: 'bg-accent/10 text-accent',
};

const roleLabel: Record<AppRole, string> = {
  user: 'User',
  admin: 'Admin',
  support: 'Support',
};

export default function AdminUsersPage() {
  const { data, isLoading } = useAdminUsers();
  const users: AdminUser[] = data ?? [];
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const filtered = useMemo(() => {
    return users.filter((u: AdminUser) => {
      const matchesSearch =
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.phone.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || u.role === filter;
      return matchesSearch && matchesFilter;
    });
  }, [users, search, filter]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const onlineThreshold = 5 * 60 * 1000;
  const isOnline = (lastLogin: string | null) => {
    if (!lastLogin) return false;
    return Date.now() - new Date(lastLogin).getTime() < onlineThreshold;
  };

  const totalUsers = users.filter((u) => u.role === 'user').length;
  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const totalSupport = users.filter((u) => u.role === 'support').length;
  const neverLoggedIn = users.filter((u) => !u.last_login_at).length;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="User Accounts"
        subtitle="View all registered users and their login activity."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Users" value={totalUsers} />
        <SummaryCard label="Admins" value={totalAdmins} />
        <SummaryCard label="Support Staff" value={totalSupport} />
        <SummaryCard label="Never Logged In" value={neverLoggedIn} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleFilters.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <UserCog className="h-7 w-7 text-primary" />
              </span>
              <p className="mt-4 text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Logins</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className={cn('text-xs font-semibold', roleBadgeClass[u.role])}>
                              {initials(u.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{u.full_name}</p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('capitalize', roleBadgeClass[u.role])}>
                          {roleLabel[u.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.last_login_at ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'flex h-2 w-2 shrink-0 rounded-full',
                                isOnline(u.last_login_at) ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                              )}
                            />
                            <div>
                              <p className="text-sm">{formatRelativeTime(u.last_login_at)}</p>
                              <p className="text-xs text-muted-foreground">{formatDateTime(u.last_login_at)}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" /> Never
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <LogIn className="h-3.5 w-3.5 text-muted-foreground" />
                          {u.login_count}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(u.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="shadow-soft">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
