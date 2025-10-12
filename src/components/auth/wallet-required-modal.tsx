'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Wallet, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface WalletRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function WalletRequiredModal({
  isOpen,
  onClose,
  title = 'Wallet Required',
  description = 'To use this feature, you need to link a Solana wallet to your account.',
}: WalletRequiredModalProps) {
  const { linkWallet } = useAuth();
  const [isLinking, setIsLinking] = useState(false);

  const handleLinkWallet = async () => {
    setIsLinking(true);
    try {
      await linkWallet();
      onClose();
    } catch (error) {
      console.error('Failed to link wallet:', error);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4">
            {description}
          </AlertDialogDescription>
          <div className="pt-4 space-y-2">
            <div className="flex items-start space-x-2 text-sm">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 font-bold text-xs">1</span>
              </div>
              <p className="text-muted-foreground">Click "Link Wallet" below</p>
            </div>
            <div className="flex items-start space-x-2 text-sm">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 font-bold text-xs">2</span>
              </div>
              <p className="text-muted-foreground">Choose your Solana wallet (Phantom, Solflare, etc.)</p>
            </div>
            <div className="flex items-start space-x-2 text-sm">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 font-bold text-xs">3</span>
              </div>
              <p className="text-muted-foreground">Approve the connection in your wallet</p>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLinkWallet} disabled={isLinking}>
            <Wallet className="h-4 w-4 mr-2" />
            {isLinking ? 'Linking...' : 'Link Wallet'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
