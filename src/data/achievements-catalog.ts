import {
  Zap,
  Battery,
  BatteryCharging,
  Crown,
  Rocket,
  Leaf,
  Award,
  Trees,
  Shield,
  Trophy,
  Users,
  Star,
  Heart,
  Flame,
  Hammer,
  Brain,
  Gamepad2,
} from 'lucide-react';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'charging' | 'environmental' | 'social' | 'gaming';
  requirementType: 'sessions' | 'kwh' | 'co2e' | 'points' | 'friends' | 'games';
  requirementValue: number;
  rewardPoints: number;
  rewardXp: number;
}

export const achievementIcons: Record<string, any> = {
  Zap,
  Battery,
  BatteryCharging,
  Crown,
  Rocket,
  Leaf,
  Award,
  Trees,
  Shield,
  Trophy,
  Users,
  Star,
  Heart,
  Flame,
  Hammer,
  Brain,
  Gamepad: Gamepad2,
};

export const chargingAchievements: Achievement[] = [
  {
    id: 'first-charge',
    name: 'First Charge',
    description: 'Complete your first charging session',
    icon: 'Zap',
    category: 'charging',
    requirementType: 'sessions',
    requirementValue: 1,
    rewardPoints: 10,
    rewardXp: 50,
  },
  {
    id: 'regular-charger',
    name: 'Regular Charger',
    description: 'Complete 10 charging sessions',
    icon: 'Battery',
    category: 'charging',
    requirementType: 'sessions',
    requirementValue: 10,
    rewardPoints: 50,
    rewardXp: 100,
  },
  {
    id: 'power-user',
    name: 'Power User',
    description: 'Complete 50 charging sessions',
    icon: 'BatteryCharging',
    category: 'charging',
    requirementType: 'sessions',
    requirementValue: 50,
    rewardPoints: 200,
    rewardXp: 500,
  },
  {
    id: 'century-club',
    name: 'Century Club',
    description: 'Charge 100 kWh total',
    icon: 'Zap',
    category: 'charging',
    requirementType: 'kwh',
    requirementValue: 100,
    rewardPoints: 100,
    rewardXp: 200,
  },
  {
    id: 'kilowatt-king',
    name: 'Kilowatt King',
    description: 'Charge 500 kWh total',
    icon: 'Crown',
    category: 'charging',
    requirementType: 'kwh',
    requirementValue: 500,
    rewardPoints: 500,
    rewardXp: 1000,
  },
  {
    id: 'fast-charger-master',
    name: 'Fast Charger Master',
    description: 'Use fast chargers 10 times',
    icon: 'Rocket',
    category: 'charging',
    requirementType: 'sessions',
    requirementValue: 10,
    rewardPoints: 150,
    rewardXp: 300,
  },
];

export const environmentalAchievements: Achievement[] = [
  {
    id: 'co2e-hero',
    name: 'CO₂e Hero',
    description: 'Save 100 kg CO₂e',
    icon: 'Leaf',
    category: 'environmental',
    requirementType: 'co2e',
    requirementValue: 100,
    rewardPoints: 100,
    rewardXp: 200,
  },
  {
    id: 'climate-champion',
    name: 'Climate Champion',
    description: 'Save 500 kg CO₂e',
    icon: 'Award',
    category: 'environmental',
    requirementType: 'co2e',
    requirementValue: 500,
    rewardPoints: 500,
    rewardXp: 1000,
  },
  {
    id: 'forest-guardian',
    name: 'Forest Guardian',
    description: 'Plant 100 trees',
    icon: 'Trees',
    category: 'environmental',
    requirementType: 'co2e',
    requirementValue: 100,
    rewardPoints: 200,
    rewardXp: 400,
  },
  {
    id: 'green-warrior',
    name: 'Green Warrior',
    description: 'Reach forest level 5',
    icon: 'Shield',
    category: 'environmental',
    requirementType: 'co2e',
    requirementValue: 500,
    rewardPoints: 300,
    rewardXp: 600,
  },
  {
    id: 'eco-legend',
    name: 'Eco Legend',
    description: 'Save 1000 kg CO₂e',
    icon: 'Trophy',
    category: 'environmental',
    requirementType: 'co2e',
    requirementValue: 1000,
    rewardPoints: 1000,
    rewardXp: 2000,
  },
];

export const socialAchievements: Achievement[] = [
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Add 5 friends',
    icon: 'Users',
    category: 'social',
    requirementType: 'friends',
    requirementValue: 5,
    rewardPoints: 50,
    rewardXp: 100,
  },
  {
    id: 'community-leader',
    name: 'Community Leader',
    description: 'Reach top 10 on leaderboard',
    icon: 'Star',
    category: 'social',
    requirementType: 'sessions',
    requirementValue: 50,
    rewardPoints: 200,
    rewardXp: 400,
  },
  {
    id: 'helpful-driver',
    name: 'Helpful Driver',
    description: 'Complete 25 charging sessions',
    icon: 'Heart',
    category: 'social',
    requirementType: 'sessions',
    requirementValue: 25,
    rewardPoints: 100,
    rewardXp: 200,
  },
];

export const gamingAchievements: Achievement[] = [
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Win 5 charging races',
    icon: 'Flame',
    category: 'gaming',
    requirementType: 'games',
    requirementValue: 5,
    rewardPoints: 150,
    rewardXp: 300,
  },
  {
    id: 'master-builder',
    name: 'Master Builder',
    description: 'Score 1000+ in forest builder',
    icon: 'Hammer',
    category: 'gaming',
    requirementType: 'games',
    requirementValue: 10,
    rewardPoints: 200,
    rewardXp: 400,
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    description: 'Score 100% on energy quiz',
    icon: 'Brain',
    category: 'gaming',
    requirementType: 'games',
    requirementValue: 1,
    rewardPoints: 100,
    rewardXp: 200,
  },
  {
    id: 'game-champion',
    name: 'Game Champion',
    description: 'Play 50 mini-games',
    icon: 'Gamepad',
    category: 'gaming',
    requirementType: 'games',
    requirementValue: 50,
    rewardPoints: 300,
    rewardXp: 600,
  },
];

export const allAchievements: Achievement[] = [
  ...chargingAchievements,
  ...environmentalAchievements,
  ...socialAchievements,
  ...gamingAchievements,
];

export const achievementsByCategory = {
  charging: chargingAchievements,
  environmental: environmentalAchievements,
  social: socialAchievements,
  gaming: gamingAchievements,
};

export const getAchievementById = (id: string): Achievement | undefined => {
  return allAchievements.find((achievement) => achievement.id === id);
};

export const calculateLevel = (xp: number): number => {
  // Level formula: level = floor(sqrt(xp / 50)) + 1
  // Level 1: 0-100 XP
  // Level 2: 100-250 XP
  // Level 3: 250-500 XP
  // Level 4: 500-850 XP
  // etc.
  return Math.floor(Math.sqrt(xp / 50)) + 1;
};

export const getXpForNextLevel = (currentLevel: number): number => {
  // XP needed for next level
  return Math.pow(currentLevel, 2) * 50;
};

export const getForestLevel = (treesPlanted: number): number => {
  if (treesPlanted < 50) return 1; // Seedling Grove
  if (treesPlanted < 100) return 2; // Growing Forest
  if (treesPlanted < 250) return 3; // Mature Forest
  if (treesPlanted < 500) return 4; // Ancient Forest
  return 5; // Legendary Jungle
};

export const forestLevelNames = [
  'Seedling Grove',
  'Growing Forest',
  'Mature Forest',
  'Ancient Forest',
  'Legendary Jungle',
];

export const getForestLevelName = (level: number): string => {
  return forestLevelNames[level - 1] || 'Unknown Forest';
};
