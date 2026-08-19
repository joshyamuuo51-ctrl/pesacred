'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Package,
  FileEdit,
  ScrollText,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { cn, initials } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard };

const allNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Applicants', href: '/admin/applicants', icon: Users },
  { label: 'User Accounts', href: '/admin/users', icon: UserCog },
  { label: 'Loan Products', href: '/admin/products', icon: Package },
  { label: 'CMS', href: '/admin/cms', icon: FileEdit },
  { label: 'Audit Logs', href: '/admin/audit', icon: ScrollText },
  { label: 'Live Chat', href: '/admin/chat', icon: MessageSquare },
];

/** Support staff see only Live Chat. */
const supportNavItems: NavItem[] = [
  { label: 'Live Chat', href: '/admin/chat', icon: MessageSquare },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = isAdmin ? allNavItems : supportNavItems;

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5 lg:justify-start">
        <Link href="/admin" onClick={() => setMobileOpen(false)}>
          <Logo />
        </Link>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-5 pb-2">
        <div className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
          isAdmin ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
        )}>
          <Shield className="h-3.5 w-3.5" /> {isAdmin ? 'Admin Portal' : 'Support Portal'}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className={cn('text-xs font-semibold', isAdmin ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary')}>
              {profile ? initials(profile.full_name) : 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile?.full_name ?? 'Admin'}</p>
            <p className="truncate text-xs text-muted-foreground">{isAdmin ? 'Administrator' : 'Support Staff'}</p>
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
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </div>
        </div>
      )}

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-card lg:block">
        {sidebarContent}
      </aside>
    </>
  );
}

export function AdminHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
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
