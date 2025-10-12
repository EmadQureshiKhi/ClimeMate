'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, 
  Mail, 
  Wallet, 
  Link as LinkIcon,
  CheckCircle,
  Settings as SettingsIcon
} from 'lucide-react';

export function AccountSettings() {
  const { user, email, walletAddress, displayName, linkWallet, linkEmail, linkGoogle } = useAuth();

  // Get linked accounts
  const linkedAccounts = user?.linkedAccounts || [];
  const hasEmail = linkedAccounts.some((acc: any) => acc.type === 'email');
  const hasGoogle = linkedAccounts.some((acc: any) => acc.type === 'google_oauth');
  const hasWallet = linkedAccounts.some((acc: any) => acc.type === 'wallet');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and linked authentication methods
        </p>
      </div>

      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Overview
          </CardTitle>
          <CardDescription>
            Your account information and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">User ID</p>
              <p className="text-sm text-muted-foreground">{user?.id}</p>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>
          
          {displayName && (
            <div>
              <p className="text-sm font-medium">Display Name</p>
              <p className="text-sm text-muted-foreground">{displayName}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Linked Accounts
          </CardTitle>
          <CardDescription>
            Connect multiple login methods to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Email</p>
                {hasEmail ? (
                  <p className="text-sm text-muted-foreground">{email}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Not linked</p>
                )}
              </div>
            </div>
            {hasEmail ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Linked
              </Badge>
            ) : (
              <Button onClick={linkEmail} variant="outline" size="sm">
                Link Email
              </Button>
            )}
          </div>

          {/* Google */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium">Google</p>
                {hasGoogle ? (
                  <p className="text-sm text-muted-foreground">{user?.google?.email}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Not linked</p>
                )}
              </div>
            </div>
            {hasGoogle ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Linked
              </Badge>
            ) : (
              <Button onClick={linkGoogle} variant="outline" size="sm">
                Link Google
              </Button>
            )}
          </div>

          {/* Wallet */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Wallet className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Solana Wallet</p>
                {hasWallet && walletAddress ? (
                  <p className="text-sm text-muted-foreground font-mono">
                    {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Not linked</p>
                )}
              </div>
            </div>
            {hasWallet ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Linked
              </Badge>
            ) : (
              <Button onClick={linkWallet} variant="outline" size="sm">
                <Wallet className="h-4 w-4 mr-2" />
                Link Wallet
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <SettingsIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-blue-900">Why link multiple accounts?</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Login with any method you prefer</li>
                <li>• Use wallet features even if you signed up with email</li>
                <li>• Recover access if you lose one login method</li>
                <li>• One account, multiple ways to access</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
