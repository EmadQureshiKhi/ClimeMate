// Points Marketplace Rewards Catalog

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  icon: string;
  category: 'charging' | 'digital' | 'partner';
  partner?: string;
  expiryDays?: number; // Days until redemption code expires
  available: boolean;
}

export const chargingRewards: Reward[] = [
  {
    id: 'free-session',
    name: 'Free Charging Session',
    description: '1 free charging session at any DeCharge station',
    pointsCost: 500,
    icon: '⚡',
    category: 'charging',
    expiryDays: 30,
    available: true,
  },
  {
    id: 'priority-access',
    name: 'Priority Charging Access',
    description: 'Skip the queue for 30 days',
    pointsCost: 1000,
    icon: '🎟️',
    category: 'charging',
    expiryDays: 30,
    available: true,
  },
  {
    id: 'premium-membership',
    name: 'Premium Membership',
    description: '1 month premium benefits including priority access and discounts',
    pointsCost: 2500,
    icon: '🏆',
    category: 'charging',
    expiryDays: 30,
    available: true,
  },
  {
    id: 'fast-charge-boost',
    name: 'Fast Charge Boost',
    description: '3 fast charging sessions at 50% off',
    pointsCost: 1500,
    icon: '⚡',
    category: 'charging',
    expiryDays: 60,
    available: true,
  },
];

export const digitalRewards: Reward[] = [
  {
    id: 'nft-badge',
    name: 'Custom NFT Badge',
    description: 'Unique NFT badge for your profile - EV Champion edition',
    pointsCost: 5000,
    icon: '🎨',
    category: 'digital',
    available: true,
  },
  {
    id: 'profile-theme',
    name: 'Profile Theme',
    description: 'Unlock exclusive profile themes and customization options',
    pointsCost: 750,
    icon: '🎭',
    category: 'digital',
    available: true,
  },
  {
    id: 'badge-pack',
    name: 'Achievement Badge Pack',
    description: '5 exclusive achievement badges to showcase your impact',
    pointsCost: 1500,
    icon: '🏅',
    category: 'digital',
    available: true,
  },
  {
    id: 'avatar-upgrade',
    name: 'Avatar Upgrade',
    description: 'Premium avatar customization with exclusive items',
    pointsCost: 2000,
    icon: '👤',
    category: 'digital',
    available: true,
  },
];

export const partnerRewards: Reward[] = [
  {
    id: 'starbucks-5',
    name: 'Starbucks Gift Card',
    description: '$5 Starbucks gift card - enjoy your favorite coffee',
    pointsCost: 750,
    icon: '☕',
    category: 'partner',
    partner: 'Starbucks',
    expiryDays: 90,
    available: true,
  },
  {
    id: 'dominos-discount',
    name: "Domino's Pizza Discount",
    description: '20% off your next order - valid for 30 days',
    pointsCost: 600,
    icon: '🍕',
    category: 'partner',
    partner: "Domino's",
    expiryDays: 30,
    available: true,
  },
  {
    id: 'movie-tickets',
    name: 'Movie Tickets (2x)',
    description: '2 movie tickets at participating theaters',
    pointsCost: 1200,
    icon: '🎬',
    category: 'partner',
    partner: 'Cinemas',
    expiryDays: 60,
    available: true,
  },
  {
    id: 'amazon-10',
    name: 'Amazon Gift Card',
    description: '$10 Amazon gift card - shop for anything',
    pointsCost: 1500,
    icon: '🛒',
    category: 'partner',
    partner: 'Amazon',
    expiryDays: 90,
    available: true,
  },
  {
    id: 'spotify-premium',
    name: 'Spotify Premium (1 Month)',
    description: '1 month of Spotify Premium subscription',
    pointsCost: 900,
    icon: '🎵',
    category: 'partner',
    partner: 'Spotify',
    expiryDays: 30,
    available: true,
  },
];

export const allRewards: Reward[] = [
  ...chargingRewards,
  ...digitalRewards,
  ...partnerRewards,
];

export function getRewardById(id: string): Reward | undefined {
  return allRewards.find(reward => reward.id === id);
}

export function getRewardsByCategory(category: 'charging' | 'digital' | 'partner'): Reward[] {
  return allRewards.filter(reward => reward.category === category);
}

// Generate a unique redemption code
export function generateRedemptionCode(rewardId: string): string {
  const prefix = rewardId.split('-')[0].toUpperCase().slice(0, 4);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}
