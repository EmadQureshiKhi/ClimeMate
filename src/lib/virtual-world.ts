import { calculateLevel, getForestLevel } from '@/data/achievements-catalog';

export interface VirtualProfile {
  id: string;
  userWallet: string;
  avatarType: string;
  avatarColor: string;
  level: number;
  experiencePoints: number;
  forestLevel: number;
  treesPlanted: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserAchievement {
  id: string;
  userWallet: string;
  achievementId: string;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface GameScore {
  id: string;
  userWallet: string;
  gameType: string;
  score: number;
  durationSeconds: number | null;
  metadata: any;
  createdAt: string;
}

/**
 * Calculate XP needed for next level
 */
export function getXpForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 50;
}

/**
 * Calculate progress percentage to next level
 */
export function getLevelProgress(xp: number): number {
  const currentLevel = calculateLevel(xp);
  const currentLevelXp = Math.pow(currentLevel - 1, 2) * 50;
  const nextLevelXp = getXpForNextLevel(currentLevel);
  const xpInCurrentLevel = xp - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  
  return Math.floor((xpInCurrentLevel / xpNeededForLevel) * 100);
}

/**
 * Award XP to user and update level
 */
export async function awardXp(
  userWallet: string,
  xpAmount: number,
  reason: string
): Promise<{ newXp: number; newLevel: number; leveledUp: boolean }> {
  try {
    const response = await fetch('/api/virtual-world/profile/award-xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userWallet, xpAmount, reason }),
    });

    if (!response.ok) {
      throw new Error('Failed to award XP');
    }

    return await response.json();
  } catch (error) {
    console.error('Error awarding XP:', error);
    throw error;
  }
}

/**
 * Update achievement progress
 */
export async function updateAchievementProgress(
  userWallet: string,
  achievementId: string,
  progress: number
): Promise<{ completed: boolean; achievement: any }> {
  try {
    const response = await fetch('/api/virtual-world/achievements/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userWallet, achievementId, progress }),
    });

    if (!response.ok) {
      throw new Error('Failed to update achievement progress');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating achievement progress:', error);
    throw error;
  }
}

/**
 * Check and update all achievements for a user
 */
export async function checkAchievements(userWallet: string): Promise<{
  newlyCompleted: string[];
  updated: string[];
}> {
  try {
    const response = await fetch('/api/virtual-world/achievements/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userWallet }),
    });

    if (!response.ok) {
      throw new Error('Failed to check achievements');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking achievements:', error);
    throw error;
  }
}

/**
 * Plant trees based on CO₂e saved
 */
export async function plantTrees(
  userWallet: string,
  co2eSaved: number
): Promise<{ treesPlanted: number; newForestLevel: number }> {
  try {
    const response = await fetch('/api/virtual-world/forest/plant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userWallet, co2eSaved }),
    });

    if (!response.ok) {
      throw new Error('Failed to plant trees');
    }

    return await response.json();
  } catch (error) {
    console.error('Error planting trees:', error);
    throw error;
  }
}

/**
 * Submit game score
 */
export async function submitGameScore(
  userWallet: string,
  gameType: string,
  score: number,
  durationSeconds?: number,
  metadata?: any
): Promise<{ score: GameScore; rank: number; isHighScore: boolean }> {
  try {
    const response = await fetch('/api/virtual-world/games/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userWallet,
        gameType,
        score,
        durationSeconds,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit game score');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting game score:', error);
    throw error;
  }
}

/**
 * Get avatar colors based on level
 */
export function getAvailableAvatarColors(level: number): string[] {
  const baseColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Orange
    '#EF4444', // Red
  ];

  if (level >= 5) {
    baseColors.push(
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#14B8A6'  // Teal
    );
  }

  if (level >= 10) {
    baseColors.push(
      '#F97316', // Orange-red
      '#06B6D4', // Cyan
      '#84CC16'  // Lime
    );
  }

  if (level >= 15) {
    baseColors.push(
      '#A855F7', // Purple-pink
      '#F43F5E', // Rose
      '#22D3EE'  // Sky
    );
  }

  return baseColors;
}

/**
 * Get avatar types based on level
 */
export function getAvailableAvatarTypes(level: number): string[] {
  const types = ['default', 'eco', 'tech'];

  if (level >= 10) {
    types.push('premium', 'elite');
  }

  if (level >= 20) {
    types.push('legendary', 'mythic');
  }

  return types;
}

/**
 * Calculate forest stats
 */
export function calculateForestStats(treesPlanted: number) {
  const forestLevel = getForestLevel(treesPlanted);
  const co2eSaved = treesPlanted; // 1 tree = 1 kg CO₂e
  
  let nextLevelTrees = 50;
  if (forestLevel === 2) nextLevelTrees = 100;
  else if (forestLevel === 3) nextLevelTrees = 250;
  else if (forestLevel === 4) nextLevelTrees = 500;
  else if (forestLevel === 5) nextLevelTrees = treesPlanted; // Max level

  const progress = forestLevel === 5 ? 100 : Math.floor((treesPlanted / nextLevelTrees) * 100);

  return {
    forestLevel,
    treesPlanted,
    co2eSaved,
    nextLevelTrees,
    progress,
  };
}
