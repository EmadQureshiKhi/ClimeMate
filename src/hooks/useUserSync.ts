import { useEffect } from 'react';
import { useAuth } from './useAuth';

export function useUserSync() {
  const { isAuthenticated, userId, email, walletAddress, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && userId) {
      console.log('🔄 Syncing user to database:', {
        privyId: userId,
        email,
        walletAddress: walletAddress || 'none',
        userName: user?.google?.name || user?.email?.address?.split('@')[0],
        linkedAccounts: user?.linkedAccounts?.length || 0,
      });

      // Sync user to database
      fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privyId: userId,
          email: email || null,
          walletAddress: walletAddress || null, // Explicitly send null if no wallet
          name: user?.google?.name || user?.email?.address?.split('@')[0] || null,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('✅ User synced successfully:', data);
        })
        .catch((error) => {
          console.error('❌ Failed to sync user:', error);
        });
    }
  }, [isAuthenticated, userId, email, walletAddress, user]);
}
