'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Wallet,
  FolderOpen,
  CreditCard,
  Bell,
  User,
  LifeBuoy,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { cn, initials } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMyNotifications } from '@/hooks/use-data';
import type { Notification } from '@/types/database';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Apply Loan', href: '/dashboard/apply', icon: FileText },
  { label: 'My Loans', href: '/dashboard/loans', icon: Wallet },
  { label: 'Documents', href: '/dashboard/documents', icon: FolderOpen },
  { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { label: 'Profile', href: '/dashboard/profile', icon: User },
  { label: 'Support', href: '/dashboard/support', icon: LifeBuoy },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { data: notifData } = useMyNotifications();
  const notifications: Notification[] = notifData ?? [];
  const [mobileOpen, setMobileOpen] = useState(false);

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5 lg:justify-start">
        <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
          <Logo />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.href === '/dashboard/notifications' && unreadCount > 0 && (
                <Badge className={cn('h-5 px-1.5 text-xs', active ? 'bg-white/20 text-white' : 'bg-primary text-primary-foreground')}>
                  {unreadCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {profile ? initials(profile.full_name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile?.full_name ?? 'User'}</p>
            <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="mt-1 w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-[18px] w-[18px]" /> Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Logo />
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-card lg:block">
        {sidebarContent}
      </aside>
    </>
  );
}

export function DashboardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
