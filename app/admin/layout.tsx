'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { AdminSidebar } from '@/components/admin-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/** Routes that support staff are allowed to access. */
const supportAllowedRoutes = ['/admin/chat'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isStaff, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?redirect=/admin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && isStaff && !isAdmin) {
      const isAllowed = supportAllowedRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + '/')
      );
      if (!isAllowed) {
        router.replace('/admin/chat');
      }
    }
  }, [loading, user, isAdmin, isStaff, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!isStaff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold">Access Denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have permission to access this area. The admin portal is restricted to
            authorized staff.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 lg:flex-row">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden items-center justify-end gap-2 px-6 py-3 lg:flex">
          <ThemeToggle />
        </div>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
