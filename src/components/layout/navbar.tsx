'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/hooks/useAuth';
import { 
  Menu, 
  Leaf, 
  BarChart3, 
  Upload, 
  Award, 
  ShoppingCart,
  Target,
  Calculator,
  LogOut,
  User,
  Wallet,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

function AuthButton() {
  const { isAuthenticated, email, walletAddress, displayName, login, logout, linkWallet, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    // Redirect to dashboard after logout
    router.push('/');
  };

  if (!isAuthenticated) {
    return (
      <Button onClick={login} size="sm">
        Login
      </Button>
    );
  }

  // Check if user has email/Google but no wallet linked
  const hasEmailOrGoogle = email || user?.google;
  const needsWalletLink = hasEmailOrGoogle && !walletAddress;

  return (
    <div className="flex items-center space-x-2">
      <div className="hidden md:flex items-center space-x-2 text-sm">
        {walletAddress ? (
          // Show wallet address for wallet users
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span>{walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</span>
          </div>
        ) : displayName ? (
          // Show display name for email/Google users
          <div className="flex items-center space-x-1 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{displayName}</span>
          </div>
        ) : email ? (
          // Fallback to email
          <div className="flex items-center space-x-1 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{email}</span>
          </div>
        ) : null}
      </div>
      
      {/* Link Wallet Button - show if user has email but no wallet */}
      {needsWalletLink && (
        <Button onClick={linkWallet} variant="outline" size="sm">
          <Wallet className="h-4 w-4 mr-2" />
          Link Wallet
        </Button>
      )}
      
      {/* Settings Button */}
      <Link href="/settings">
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </Link>
      
      <Button onClick={handleLogout} variant="outline" size="sm">
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Upload Data', href: '/upload', icon: Upload },
  { name: 'Certificates', href: '/certificates', icon: Award },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingCart },
  { name: 'GHG Calculator', href: '/ghg-calculator', icon: Calculator },
  { name: 'SEMA Tool', href: '/sema', icon: Target },
  { name: 'Verify', href: '/verify', icon: ShieldCheck },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="https://i.ibb.co/dwzM2KLM/Untitled-design-removebg-preview.png" 
              alt="ClimeMate Logo" 
             className="h-12 w-16 object-contain -mt-1"
            />
           <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight -ml-3">
              Clime<span className="text-green-800">Mate</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
                    pathname === item.href
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <AuthButton />
            <ThemeToggle />
            
            {/* Mobile menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-center space-x-3 text-sm font-medium transition-colors hover:text-primary p-2 rounded-md',
                          pathname === item.href
                            ? 'text-primary bg-primary/10'
                            : 'text-muted-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}