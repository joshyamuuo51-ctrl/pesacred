import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Logo />
      <h1 className="mt-8 font-display text-6xl font-bold text-primary">404</h1>
      <p className="mt-2 text-lg font-semibold">Page not found</p>
      <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  );
}
