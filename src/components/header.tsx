import Link from 'next/link';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="bg-card shadow-sm sticky top-0 z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Logo className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl">Autobusų Tvarkaraštis</span>
        </Link>
        <nav>
            <Button asChild>
                <Link href="/login">Prisijungti</Link>
            </Button>
        </nav>
      </div>
    </header>
  );
}
