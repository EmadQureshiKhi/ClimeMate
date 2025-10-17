'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  ShieldCheck,
  ChevronDown,
  Mail,
  CheckCircle,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

function AuthButton() {
  const { isAuthenticated, email, walletAddress, displayName, login, logout, linkWallet, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!isAuthenticated) {
    return (
      <Button onClick={login} size="sm">
        Login
      </Button>
    );
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (displayName) {
      return displayName.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    if (walletAddress) {
      return walletAddress.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Get display text
  const getDisplayText = () => {
    if (displayName) return displayName;
    if (walletAddress) return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
    if (email) return email.split('@')[0];
    return 'User';
  };

  const hasEmailOrGoogle = email || user?.google;
  const needsWalletLink = hasEmailOrGoogle && !walletAddress;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-10">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-green-600 text-white text-xs">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block text-sm font-medium">
            {getDisplayText()}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">{displayName || 'User'}</p>
            {email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>{email}</span>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Wallet Info */}
        {walletAddress && (
          <>
            <div className="px-2 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">Wallet</span>
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Linked
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="h-3 w-3 text-muted-foreground" />
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </code>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Email/Google Info */}
        {(email || user?.google) ? (
          <>
            <div className="px-2 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {user?.google ? 'Google' : 'Email'}
                </span>
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Linked
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">
                  {user?.google?.email || email}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Mail className="h-4 w-4 mr-2" />
              Link Email/Google
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Link Wallet Option */}
        {needsWalletLink && (
          <>
            <DropdownMenuItem onClick={linkWallet}>
              <Wallet className="h-4 w-4 mr-2" />
              Link Wallet
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Profile Settings */}
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <User className="h-4 w-4 mr-2" />
          Profile Settings
        </DropdownMenuItem>

        {/* Coming Soon Options */}
        <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
          <CreditCard className="h-4 w-4 mr-2" />
          <span>Billing & Usage</span>
          <Badge variant="outline" className="ml-auto text-xs">Soon</Badge>
        </DropdownMenuItem>

        <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
          <Settings className="h-4 w-4 mr-2" />
          <span>Preferences</span>
          <Badge variant="outline" className="ml-auto text-xs">Soon</Badge>
        </DropdownMenuItem>

        <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
          <ExternalLink className="h-4 w-4 mr-2" />
          <span>View on Explorer</span>
          <Badge variant="outline" className="ml-auto text-xs">Soon</Badge>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
            <ThemeToggle />
            <AuthButton />
            
            {/* Mobile menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-6 mt-8">
                  {/* Navigation Links */}
                  <div className="flex flex-col space-y-2">
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}