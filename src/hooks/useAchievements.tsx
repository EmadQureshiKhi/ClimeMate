'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserAchievement } from '@/lib/virtual-world';
import { Achievement } from '@/data/achievements-catalog';

export function useAchievements() {
  const { walletAddress } = useAuth();
  const [achievements, setAchievements] = useState<(UserAchievement & { achievement: Achievement })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = async () => {
    if (!walletAddress) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/virtual-world/achievements/user?userWallet=${walletAddress}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }

      const data = await response.json();
      
      if (data.success) {
        setAchievements(data.achievements);
      } else {
        throw new Error(data.error || 'Failed to fetch achievements');
      }
    } catch (err: any) {
      console.error('Error fetching achievements:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [walletAddress]);

  const completedCount = achievements.filter(a => a.completed).length;
  const totalCount = achievements.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    achievements,
    completedCount,
    totalCount,
    completionRate,
    isLoading,
    error,
    refetch: fetchAchievements,
  };
}
