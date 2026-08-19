'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useNotificationsRealtime } from '@/hooks/use-data';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChatWidget } from '@/components/chat-widget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useNotificationsRealtime();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?redirect=/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 lg:flex-row">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden items-center justify-end gap-2 px-6 py-3 lg:flex">
          <ThemeToggle />
        </div>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
      <ChatWidget />
    </div>
  );
}
