'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Coins,
  Gift,
  Zap,
  Sparkles,
  ShoppingBag,
  Loader2,
  Clock,
  Award,
  Ticket,
  Trophy,
  Palette,
  Coffee,
  Pizza,
  Film,
  ShoppingCart,
  Music,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  chargingRewards,
  digitalRewards,
  partnerRewards,
  type Reward,
} from '@/data/rewards-catalog';

interface PointsBalance {
  available: number;
  earned: number;
  spent: number;
  purchased: number;
}

interface Redemption {
  id: string;
  rewardName: string;
  rewardCategory: string;
  pointsCost: number;
  redemptionCode: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function PointsMarketplacePage() {
  const { walletAddress } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const fetchData = async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    try {
      const [balanceRes, historyRes] = await Promise.all([
        fetch(`/api/charging/points/balance?userWallet=${walletAddress}`),
        fetch(`/api/charging/points/history?userWallet=${walletAddress}&limit=10`),
      ]);

      const [balanceData, historyData] = await Promise.all([
        balanceRes.json(),
        historyRes.json(),
      ]);

      if (balanceData.success) {
        setBalance(balanceData.balance);
      }

      if (historyData.success) {
        setRedemptions(historyData.redemptions);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [walletAddress]);

  const handleRedeem = async (reward: Reward) => {
    if (!walletAddress || !balance) return;

    if (balance.available < reward.pointsCost) {
      toast({
        title: 'Insufficient Points',
        description: `You need ${reward.pointsCost} points but only have ${balance.available}`,
        variant: 'destructive',
      });
      return;
    }

    setRedeeming(reward.id);

    try {
      const response = await fetch('/api/charging/points/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWallet: walletAddress,
          rewardId: reward.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem');
      }

      toast({
        title: 'Reward Redeemed!',
        description: (
          <div className="space-y-2">
            <p className="font-semibold">{reward.name}</p>
            {data.redemption.redemptionCode && (
              <div className="bg-muted p-2 rounded">
                <p className="text-xs text-muted-foreground">Redemption Code:</p>
                <p className="font-mono font-bold">{data.redemption.redemptionCode}</p>
              </div>
            )}
            <p className="text-xs">New balance: {data.newBalance} points</p>
          </div>
        ),
        duration: 10000,
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error redeeming reward:', error);
      toast({
        title: 'Redemption Failed',
        description: error.message || 'Failed to redeem reward',
        variant: 'destructive',
      });
    } finally {
      setRedeeming(null);
    }
  };

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Wallet Required</h3>
              <p className="text-muted-foreground">
                Please connect your wallet to access the Points Marketplace
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-purple-950/30 dark:to-pink-950/30">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 p-8 md:p-12 shadow-2xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-pink-500/20 blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <ShoppingBag className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white">
                    Points Marketplace
                  </h1>
                  <p className="text-purple-100 mt-1 text-lg">
                    Redeem your charging points for exclusive rewards
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Points Balance */}
          {balance && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-purple-50/50 dark:from-slate-900 dark:to-purple-950/50 border border-purple-200/50 dark:border-purple-800/50 shadow-xl">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl"></div>
              
              <div className="relative p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <Coins className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold">Your Points Balance</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Available Points</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {balance.available.toLocaleString()}
                      </p>
                      <Sparkles className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Total Earned</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {balance.earned.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Total Spent</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {balance.spent.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Purchased</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {balance.purchased.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EV Charging Rewards */}
          <RewardSection
            title="EV Charging Rewards"
            description="Exclusive rewards for EV drivers"
            rewards={chargingRewards}
            balance={balance}
            redeeming={redeeming}
            onRedeem={handleRedeem}
          />

          {/* Digital Rewards */}
          <RewardSection
            title="Digital Rewards"
            description="Unlock exclusive digital content"
            rewards={digitalRewards}
            balance={balance}
            redeeming={redeeming}
            onRedeem={handleRedeem}
          />

          {/* Partner Rewards */}
          <RewardSection
            title="Partner Offers"
            description="Gift cards and discounts from our partners"
            rewards={partnerRewards}
            balance={balance}
            redeeming={redeeming}
            onRedeem={handleRedeem}
          />

          {/* Redemption History */}
          {redemptions.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent"></div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h2 className="text-2xl font-bold">Redemption History</h2>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent"></div>
              </div>

              <div className="space-y-4">
                {redemptions.map((redemption) => (
                  <RedemptionCard key={redemption.id} redemption={redemption} />
                ))}
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="flex justify-center pt-8">
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="group hover:border-purple-300 dark:hover:border-purple-700"
            >
              <Link href="/ev-charging" className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getRewardIcon(reward: Reward) {
  const iconClass = "h-8 w-8";
  
  if (reward.id.includes('free-session') || reward.id.includes('fast-charge')) {
    return <Zap className={iconClass} />;
  }
  if (reward.id.includes('priority')) {
    return <Ticket className={iconClass} />;
  }
  if (reward.id.includes('premium')) {
    return <Trophy className={iconClass} />;
  }
  if (reward.id.includes('nft') || reward.id.includes('badge')) {
    return <Award className={iconClass} />;
  }
  if (reward.id.includes('theme') || reward.id.includes('avatar')) {
    return <Palette className={iconClass} />;
  }
  if (reward.id.includes('starbucks')) {
    return <Coffee className={iconClass} />;
  }
  if (reward.id.includes('dominos')) {
    return <Pizza className={iconClass} />;
  }
  if (reward.id.includes('movie')) {
    return <Film className={iconClass} />;
  }
  if (reward.id.includes('amazon')) {
    return <ShoppingCart className={iconClass} />;
  }
  if (reward.id.includes('spotify')) {
    return <Music className={iconClass} />;
  }
  return <Gift className={iconClass} />;
}

function RewardSection({
  title,
  description,
  rewards,
  balance,
  redeeming,
  onRedeem,
}: {
  title: string;
  description: string;
  rewards: Reward[];
  balance: PointsBalance | null;
  redeeming: string | null;
  onRedeem: (reward: Reward) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 dark:via-purple-700 to-transparent"></div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-1">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 dark:via-purple-700 to-transparent"></div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            balance={balance}
            isRedeeming={redeeming === reward.id}
            onRedeem={onRedeem}
          />
        ))}
      </div>
    </div>
  );
}

function RewardCard({
  reward,
  balance,
  isRedeeming,
  onRedeem,
}: {
  reward: Reward;
  balance: PointsBalance | null;
  isRedeeming: boolean;
  onRedeem: (reward: Reward) => void;
}) {
  const canAfford = balance && balance.available >= reward.pointsCost;
  
  const categoryColors = {
    charging: 'from-blue-500 to-cyan-500',
    digital: 'from-purple-500 to-pink-500',
    partner: 'from-orange-500 to-red-500',
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${categoryColors[reward.category]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${categoryColors[reward.category]} text-white shadow-lg`}>
            {getRewardIcon(reward)}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {(reward.id === 'free-session' || reward.id === 'starbucks-5') && (
                <Badge className="bg-yellow-500 text-yellow-950 border-yellow-600 font-semibold shadow-lg">
                  Popular
                </Badge>
              )}
              <Badge 
                variant={canAfford ? 'default' : 'secondary'}
                className="font-bold px-3 py-1"
              >
                {reward.pointsCost.toLocaleString()} pts
              </Badge>
            </div>
            {reward.partner && (
              <Badge variant="outline" className="text-xs">
                {reward.partner}
              </Badge>
            )}
          </div>
        </div>

        <h3 className="font-bold text-lg mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {reward.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
          {reward.description}
        </p>

        {reward.expiryDays && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Clock className="h-3 w-3" />
            <span>Valid for {reward.expiryDays} days</span>
          </div>
        )}

        <Button
          onClick={() => onRedeem(reward)}
          disabled={!canAfford || isRedeeming || !reward.available}
          className={`w-full font-semibold ${
            canAfford 
              ? `bg-gradient-to-r ${categoryColors[reward.category]} hover:opacity-90 text-white shadow-lg` 
              : ''
          }`}
          variant={canAfford ? 'default' : 'outline'}
        >
          {isRedeeming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Redeeming...
            </>
          ) : !reward.available ? (
            'Currently Unavailable'
          ) : !canAfford ? (
            <>
              <Coins className="h-4 w-4 mr-2" />
              Need {(reward.pointsCost - (balance?.available || 0)).toLocaleString()} More
            </>
          ) : (
            <>
              <Gift className="h-4 w-4 mr-2" />
              Redeem Now
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </div>

    </div>
  );
}

function RedemptionCard({ redemption }: { redemption: Redemption }) {
  const isExpired = redemption.expiresAt && new Date(redemption.expiresAt) < new Date();

  return (
    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg transition-all duration-300">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        isExpired ? 'bg-slate-400' : 'bg-gradient-to-b from-green-500 to-emerald-500'
      }`}></div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 pl-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className={`h-5 w-5 ${isExpired ? 'text-slate-400' : 'text-green-500'}`} />
            <h4 className="font-bold">{redemption.rewardName}</h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="h-4 w-4" />
              <span>{redemption.pointsCost.toLocaleString()} points</span>
              <span>•</span>
              <Clock className="h-4 w-4" />
              <span>{formatDistanceToNow(new Date(redemption.createdAt), { addSuffix: true })}</span>
            </div>

            {redemption.redemptionCode && (
              <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
                <span className="text-xs font-medium text-muted-foreground">Code:</span>
                <code className="text-sm font-bold font-mono">{redemption.redemptionCode}</code>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge 
            variant={isExpired ? 'secondary' : 'default'}
            className={`${!isExpired && 'bg-green-500 hover:bg-green-600'}`}
          >
            {isExpired ? 'Expired' : 'Active'}
          </Badge>
          
          {redemption.expiresAt && !isExpired && (
            <p className="text-xs text-muted-foreground text-right">
              Expires {formatDistanceToNow(new Date(redemption.expiresAt), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
