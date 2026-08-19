'use client';

import { useState, useMemo } from 'react';
import {
  ScrollText,
  Search,
  Download,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminAuditLogs, type AuditLogWithProfile } from '@/hooks/use-admin';
import { formatDateTime } from '@/lib/utils';

export default function AdminAuditPage() {
  const { data, isLoading } = useAdminAuditLogs();
  const logs: AuditLogWithProfile[] = data ?? [];
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return logs.filter((log) =>
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.profiles?.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [logs, search]);

  const handleExport = () => {
    if (!filtered.length) return;
    const headers = ['Date', 'Actor', 'Email', 'Action', 'Entity Type', 'Entity ID'];
    const rows = filtered.map((log) => [
      formatDateTime(log.created_at),
      log.profiles?.full_name ?? 'System',
      log.profiles?.email ?? '—',
      log.action,
      log.entity_type ?? '—',
      log.entity_id ?? '—',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Audit Logs"
        subtitle="Complete audit trail of all administrative actions."
        action={
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by action, actor, or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <ScrollText className="h-7 w-7 text-primary" />
              </span>
              <p className="mt-4 text-sm text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground">{formatDateTime(log.created_at)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{log.profiles?.full_name ?? 'System'}</p>
                          <p className="text-xs text-muted-foreground">{log.profiles?.email ?? '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.entity_type ? `${log.entity_type}` : '—'}
                      </TableCell>
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
