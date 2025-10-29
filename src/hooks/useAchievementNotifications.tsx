'use client';

import { useToast } from '@/hooks/use-toast';
import { getAchievementById, achievementIcons } from '@/data/achievements-catalog';
import { Trophy, Sparkles } from 'lucide-react';

export function useAchievementNotifications() {
  const { toast } = useToast();

  const showAchievementUnlock = (achievementId: string) => {
    const achievement = getAchievementById(achievementId);
    if (!achievement) return;

    const Icon = achievementIcons[achievement.icon] || Trophy;

    toast({
      title: (
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span>Achievement Unlocked!</span>
        </div>
      ),
      description: (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500 text-white rounded-lg">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold">{achievement.name}</p>
              <p className="text-sm text-muted-foreground">{achievement.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span>+{achievement.rewardXp} XP</span>
            <span>•</span>
            <span>+{achievement.rewardPoints} points</span>
          </div>
        </div>
      ),
      duration: 8000,
    });
  };

  const showLevelUp = (newLevel: number) => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <span>Level Up!</span>
        </div>
      ),
      description: (
        <div className="space-y-1">
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Level {newLevel}
          </p>
          <p className="text-sm text-muted-foreground">
            You've reached a new level! Keep charging to unlock more rewards.
          </p>
        </div>
      ),
      duration: 6000,
    });
  };

  const showTreesPlanted = (treesPlanted: number) => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌳</span>
          <span>Trees Planted!</span>
        </div>
      ),
      description: (
        <div className="space-y-1">
          <p className="font-bold">+{treesPlanted} trees added to your forest</p>
          <p className="text-sm text-muted-foreground">
            {treesPlanted} kg CO₂e saved from this charging session
          </p>
        </div>
      ),
      duration: 5000,
    });
  };

  const showXpGained = (xp: number) => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <span>XP Gained!</span>
        </div>
      ),
      description: (
        <p className="font-bold text-blue-600">+{xp} XP</p>
      ),
      duration: 3000,
    });
  };

  return {
    showAchievementUnlock,
    showLevelUp,
    showTreesPlanted,
    showXpGained,
  };
}
