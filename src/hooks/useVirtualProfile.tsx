'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { VirtualProfile } from '@/lib/virtual-world';

export function useVirtualProfile() {
  const { walletAddress } = useAuth();
  const [profile, setProfile] = useState<VirtualProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!walletAddress) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/virtual-world/profile?userWallet=${walletAddress}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
      } else {
        throw new Error(data.error || 'Failed to fetch profile');
      }
    } catch (err: any) {
      console.error('Error fetching virtual profile:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [walletAddress]);

  const updateAvatar = async (avatarType: string, avatarColor: string) => {
    if (!walletAddress) return;

    try {
      const response = await fetch('/api/virtual-world/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userWallet: walletAddress, avatarType, avatarColor }),
      });

      if (!response.ok) {
        throw new Error('Failed to update avatar');
      }

      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
      }
    } catch (err: any) {
      console.error('Error updating avatar:', err);
      throw err;
    }
  };

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
    updateAvatar,
  };
}
