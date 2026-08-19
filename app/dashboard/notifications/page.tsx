'use client';

import { Bell, CheckCheck, BellOff } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useMyNotifications, useMarkNotificationRead } from '@/hooks/use-data';
import type { Notification } from '@/types/database';
import { formatRelativeTime, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const { data, isLoading } = useMyNotifications();
  const notifications: Notification[] = data ?? [];
  const markRead = useMarkNotificationRead();

  const unread = notifications?.filter((n) => !n.read) ?? [];
  const read = notifications?.filter((n) => n.read) ?? [];

  const handleMarkAllRead = async () => {
    if (!unread.length) return;
    try {
      await Promise.all(unread.map((n) => markRead.mutateAsync(n.id)));
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark notifications as read.');
    }
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Notifications"
        subtitle={unread.length > 0 ? `You have ${unread.length} unread notification${unread.length > 1 ? 's' : ''}.` : 'You are all caught up.'}
        action={
          unread.length > 0 ? (
            <Button variant="outline" onClick={handleMarkAllRead} className="gap-2">
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : notifications && notifications.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <BellOff className="h-7 w-7 text-primary" />
            </span>
            <p className="mt-4 text-sm text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {unread.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Unread</h3>
              {unread.map((n) => (
                <Card key={n.id} className="border-primary/30 shadow-soft">
                  <CardContent className="flex items-start gap-3 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bell className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{n.title}</p>
                        <Badge className="bg-primary text-primary-foreground text-[10px]">New</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(n.created_at)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => markRead.mutate(n.id)}>
                      Mark read
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {read.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Earlier</h3>
              {read.map((n) => (
                <Card key={n.id} className="shadow-soft">
                  <CardContent className="flex items-start gap-3 p-4 opacity-75">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Bell className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(n.created_at)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
